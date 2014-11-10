from urllib.request import urlopen
import re

regex_author = "<p></p>

htmltext = urlopen("http://arrow.dit.ie/authors.html").read();
print (htmltext)
