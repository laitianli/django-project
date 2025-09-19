from django.shortcuts import render, HttpResponse, HttpResponseRedirect
from . import models
from django.urls import reverse
# Create your views here.


def add_book_view(request):
    if request.method == 'GET':
        return render(request, 'app_db/add_book.html')
    elif request.method == 'POST':
        title = request.POST['title']
        price = request.POST['price']
        publish = request.POST['publish'] 
        pub_date= request.POST['pub_date']

        book = models.Book(title=title, price=price, publish=publish, pub_date=pub_date)
        book.save()
        # book = models.Book.objects.create(title=title, price=price, publish=publish, pub_date=pub_date)
        # print(book, type(book))

        #return HttpResponse('添加书籍[ %s ]成功!' % title)
        return HttpResponseRedirect(reverse('queryBook'))
    
def query_book_view(request):
    books = models.Book.objects.all()
    return render(request, 'app_db/query_book.html', locals())