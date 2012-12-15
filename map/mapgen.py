import os,sys
import Image
png = Image.open("map.png")

infile = open('map.outline', 'r')
outfile = open('map.js', 'w')

outfile.write(infile.read());
infile.close();
lastimpass = 0,0

for x in range(png.size[0]):
	for y in range(png.size[1]):
		pixel = png.getpixel((x,y))
		if pixel[0] == 0 and  pixel[1] == 0 and pixel[2] == 0:
			lastimpass = x,y


for x in range(lastimpass[0]+1):
	for y in range(lastimpass[1]+1):
		pixel = png.getpixel((x,y))
		if pixel[0] == 0 and  pixel[1] == 0 and pixel[2] == 0:
			out = "'"+str(x)+ ","+ str(y)+ "': 'impassable',"+"\n"
		elif  pixel[0] == 255 and  pixel[1] == 255 and pixel[2] == 255:
			out = "'"+str(x)+ ","+ str(y)+ "': 'passable',"+"\n"
		else:
			out = "'"+str(x)+ ","+ str(y)+ "': 'spawn',"+"\n"
		outfile.write(out)

outfile.write("};")


	
