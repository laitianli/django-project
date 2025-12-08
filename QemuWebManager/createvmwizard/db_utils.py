from django.db import connection, models, transaction
import re
"""
动态创建/删除虚拟机对应的数据表

用法示例：
    from createvmwizard.db_utils import create_vm_table, drop_vm_table
    # 创建表 vm_myvm
    Model = create_vm_table('myvm')
    # 使用 Model.objects.create(...) 插入数据
    # 删除表
    drop_vm_table('myvm')

说明：
 - 生成表名格式为 `vm_<vm_name>`，模型类名为 `VM_<vm_name>`。
 - 表包含字段：`cpu_count`(int), `memory_mb`(int), `disk_size`(bigint 可空), `disk_file`(varchar 可空)、以及自动主键 `id`。
 - 该实现使用 Django 的 `schema_editor.create_model` 在运行时创建数据表。
"""


def _make_vm_model():
    """返回动态 Model 类和目标表名"""
    table_name = f"vm_table"
    model_name = f"VM_TABLE"

    # 定义 Meta
    class Meta:
        db_table = table_name

    attrs = {
        '__module__': 'createvmwizard.dynamic_models',
        'Meta': Meta,
        'vm_name': models.CharField(max_length=128, unique=True),
        'cpu_count': models.IntegerField(),
        'memory_mb': models.IntegerField(),
        # 保存子表名，便于查询或调试
        'iso_table': models.CharField(max_length=128, null=True, blank=True),
        'disk_table': models.CharField(max_length=128, null=True, blank=True),
    }

    Model = type(model_name, (models.Model,), attrs)
    return Model, table_name


def create_vm_table(vm_name):
    """在数据库中创建名为 `vm_<vm_name>` 的表。

    如果表已经存在，会抛出异常（可根据需要改为忽略）。
    返回动态生成的 Model 类，可用于 ORM 操作（注意：未注册到 app cache，部分 Django 功能可能受限）。
    """
    vm_name = re.sub(r'[^a-zA-Z0-9_]', '_', vm_name)  # 简单过滤非法字符
    Model, table_name = _make_vm_model()

    # 检查表是否已存在，兼容多种数据库
    vendor = connection.vendor
    exists = False
    with connection.cursor() as cur:
        if vendor == 'postgresql':
            cur.execute("SELECT to_regclass(%s)", [table_name])
            try:
                exists = cur.fetchone()[0] is not None
            except Exception:
                exists = False
        elif vendor == 'sqlite':
            cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=%s", [table_name])
            exists = cur.fetchone() is not None
        elif vendor == 'mysql':
            cur.execute("SHOW TABLES LIKE %s", [table_name])
            exists = cur.fetchone() is not None
        else:
            # 其他数据库可补充
            pass

    if exists:
        print(f"[Info] table {table_name} already exists")

    # 使用 schema_editor 创建表，兼容 SQLite 外键约束
    vendor = connection.vendor

    # 子表名规则
    iso_table_name = f"vm_{vm_name}_iso"
    disk_table_name = f"vm_{vm_name}_disk"

    # 生成子表模型
    def _make_iso_model(vm_name):
        table = f"vm_{vm_name}_iso"
        name = f"VM_{vm_name}_ISO"

        class Meta:
            db_table = table

        attrs = {
            '__module__': 'createvmwizard.dynamic_models',
            'Meta': Meta,
            # 存储 ISO 的路径和文件名
            'storage_pool_path': models.CharField(max_length=1024, null=True, blank=True),
            'iso_file': models.CharField(max_length=512, null=True, blank=True),
            'partition_name': models.CharField(max_length=64, null=True, blank=True),
            'bus': models.CharField(max_length=32, null=True, blank=True),
        }
        IsoModel = type(name, (models.Model,), attrs)
        return IsoModel, table

    def _make_disk_model(vm_name):
        table = f"vm_{vm_name}_disk"
        name = f"VM_{vm_name}_DISK"

        class Meta:
            db_table = table

        attrs = {
            '__module__': 'createvmwizard.dynamic_models',
            'Meta': Meta,
            # 磁盘信息
            'disk_file': models.CharField(max_length=1024, null=True, blank=True),
            'disk_size': models.CharField(max_length=64, null=True, blank=True),
            'dev': models.CharField(max_length=64, null=True, blank=True),
            'bus': models.CharField(max_length=32, null=True, blank=True),
            'type': models.CharField(max_length=32, null=True, blank=True),
        }
        DiskModel = type(name, (models.Model,), attrs)
        return DiskModel, table

    IsoModel, iso_table = _make_iso_model(vm_name)
    DiskModel, disk_table = _make_disk_model(vm_name)

    def _create_models(models_to_create):
        if vendor == 'sqlite':
            with connection.cursor() as cur:
                cur.execute('PRAGMA foreign_keys=OFF;')
            try:
                with transaction.atomic():
                    with connection.schema_editor() as schema_editor:
                        for m in models_to_create:
                            schema_editor.create_model(m)
            finally:
                with connection.cursor() as cur:
                    cur.execute('PRAGMA foreign_keys=ON;')
        else:
            with transaction.atomic():
                with connection.schema_editor() as schema_editor:
                    for m in models_to_create:
                        schema_editor.create_model(m)

    # 创建主表、iso 子表、disk 子表（按顺序）
    _create_models([Model, IsoModel, DiskModel])

    # 在主表中写入子表名的默认值（可选），采用原模型的 manager 操作插入一行或通过 SQL 更新
    # 这里仅返回动态 Model 类和子模型，以便调用方继续使用 ORM
    return Model, IsoModel, DiskModel


def drop_vm_table(vm_name):
    """删除对应的 vm_<vm_name> 表（如果存在）。"""
    # 先构造三个模型
    vm_name = re.sub(r'[^a-zA-Z0-9_]', '_', vm_name)  # 简单过滤非法字符
    # Model, table_name = _make_vm_model(vm_name)
    # IsoModel = type(f"VM_{vm_name}_ISO", (), {})
    # DiskModel = type(f"VM_{vm_name}_DISK", (), {})
    # 真实表名
    # table_name = f"vm_{vm_name}"
    iso_table = f"vm_{vm_name}_iso"
    disk_table = f"vm_{vm_name}_disk"

    vendor = connection.vendor
    def _drop_tables(tables):
        if vendor == 'sqlite':
            with connection.cursor() as cur:
                cur.execute('PRAGMA foreign_keys=OFF;')
            try:
                with transaction.atomic():
                    with connection.cursor() as cur:
                        for t in tables:
                            cur.execute(f"DROP TABLE IF EXISTS {t}")
            finally:
                with connection.cursor() as cur:
                    cur.execute('PRAGMA foreign_keys=ON;')
        else:
            with transaction.atomic():
                with connection.cursor() as cur:
                    for t in tables:
                        cur.execute(f"DROP TABLE IF EXISTS {t}")

    # 先删除子表，主表不删除。
    _drop_tables([iso_table, disk_table])
