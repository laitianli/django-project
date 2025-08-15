#!/usr/bin/env python
# _*_ coding:utf-8 _*_

import libvirt
import socket
import threading
import time
from libvirt import libvirtError
from test_libvirt_api import do_connect

connection = None


class wvmEventLoop(threading.Thread):
    def __init__(self, group=None, target=None, name=None, args=(), kwargs={}):
        # register the default event implementation
        # of libvirt, as we do not have an existing
        # event loop.
        libvirt.virEventRegisterDefaultImpl()

        if name is None:
            name = "libvirt event loop"

        super(wvmEventLoop, self).__init__(group, target, name, args, kwargs)

        # we run this thread in deamon mode, so it does
        # not block shutdown of the server
        self.daemon = True

    def run(self):
        while True:
            # if this method will fail it raises libvirtError
            # we do not catch the exception here so it will show up
            # in the logs. Not sure when this call will ever fail
            libvirt.virEventRunDefaultImpl()


class ConnectLibvirtd(object):
    def __init__(self, host, login_username):
        self.conn = None
        self.host = host
        self.login_username = login_username


def __libvirt_auth_credentials_callback(self, credentials, user_data):
    for credential in credentials:
        if credential[0] == libvirt.VIR_CRED_AUTHNAME:
            credential[4] = self.login
            if len(credential[4]) == 0:
                credential[4] = credential[3]
        elif credential[0] == libvirt.VIR_CRED_PASSPHRASE:
            credential[4] = self.passwd
        else:
            return -1
    return 0


def __connection_close_callback(connection, reason, opaque=None):
    try:
        if libvirt is not None:
            if reason == libvirt.VIR_CONNECT_CLOSE_REASON_ERROR:
                last_error = "connection closed: Misc I/O error"
            elif reason == libvirt.VIR_CONNECT_CLOSE_REASON_EOF:
                last_error = "connection closed: End-of-file from server"
            elif reason == libvirt.VIR_CONNECT_CLOSE_REASON_KEEPALIVE:
                last_error = "connection closed: Keepalive timer triggered"
            elif reason == libvirt.VIR_CONNECT_CLOSE_REASON_CLIENT:
                last_error = "connection closed: Client requested it"
            else:
                last_error = "connection closed: Unknown error"
    finally:
        pass


def connect_by_tcp(host):
    flags = [libvirt.VIR_CRED_AUTHNAME, libvirt.VIR_CRED_PASSPHRASE]
    auth = [flags, __libvirt_auth_credentials_callback, None]
    uri = "qemu+tcp://%s/system" % host
    try:
        connection = libvirt.openAuth(uri, auth, 0)
        last_error = None
    except libvirtError as e:
        last_error = "Connect %s Failed: " % uri
        last_error += str(e)
    if last_error:
        print(last_error)
    else:
        print("connect %s success!" % (uri))
    return connection, last_error


def connect_by_tls(login, host):
    flags = [libvirt.VIR_CRED_AUTHNAME, libvirt.VIR_CRED_PASSPHRASE]
    auth = [flags, self.__libvirt_auth_credentials_callback, None]
    uri = "qemu+tls://%s@%s/system" % (login, self.host)
    try:
        connection = libvirt.openAuth(uri, auth, None)
        last_error = None
    except libvirtError as e:
        last_error = "Connect %s Failed: " % uri
        last_error += str(e)
        connection = None
    if last_error:
        print(last_error)
    else:
        print("connect %s success!" % (uri))
    return connection, last_error


def connect_by_unix_socket():
    uri = "qemu:///system"
    try:
        connection = libvirt.open(uri)
        last_error = None
    except libvirtError as e:
        last_error = "Connect %s Failed: " % uri
        last_error += str(e)
    if last_error:
        print(last_error)
    else:
        print("connect %s success!" % (uri))
    return connection, last_error


def connect_by_ssh(login, host):
    uri = "qemu+ssh://%s@%s/system" % (login, host)
    try:
        connection = libvirt.open(uri)
        last_error = None
    except libvirtError as e:
        last_error = "Connect %s Failed: " % uri
        last_error += str(e)
    if last_error:
        print(last_error)
    else:
        print("connect %s success!" % (uri))
    return connection, last_error


def connect_to_libvirt():
    _event_loop = wvmEventLoop()
    _event_loop.start()
    conn, ret_info = connect_by_unix_socket()
    # connect_by_ssh("root", "172.16.123.137")
    if conn is not None:
        keepalive_interval = 5
        keepalive_count = 5
        try:
            conn.setKeepAlive(keepalive_interval, keepalive_count)
            try:
                conn.registerCloseCallback(__connection_close_callback, None)
            except:
                pass
        except libvirtError as e:
            if ret_info:
                ret_info += str(e)
            else:
                ret_info = str(e)

    return conn, ret_info


def connect_close(conn):
    if conn is not None and conn.isAlive():
        try:
            conn.unregisterCloseCallback()
            conn.close()

        except libvirtError as e:
            print("close failed")
            return
        print("close success!")


def main():
    conn, ret_info = connect_to_libvirt()

    if ret_info is None:
        do_connect(conn)

    # while True:
    #     print('timer.sleep(6)-----------')
    #     time.sleep(6)
    connect_close(conn)


if __name__ == "__main__":
    main()
