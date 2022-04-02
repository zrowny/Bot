import json
from PIL import Image
import sys
from os.path import exists

def gen_orders_for_image(image_path):
	formatted_orders = ""

	im = Image.open(image_path)
	pix = im.load()

	color_mappings = {
		'#BE0039': 1,
		'#FF4500': 2,
		'#FFA800': 3,
		'#FFD635': 4,
		'#00A368': 6,
		'#00CC78': 7,
		'#7EED56': 8,
		'#00756F': 9,
		'#009EAA': 10,
		'#2450A4': 12,
		'#3690EA': 13,
		'#51E9F4': 14,
		'#493AC1': 15,
		'#6A5CFF': 16,
		'#811E9F': 18,
		'#B44AC0': 19,
		'#FF3881': 22,
		'#FF99AA': 23,
		'#6D482F': 24,
		'#9C6926': 25,
		'#000000': 27,
		'#898D90': 29,
		'#D4D7D9': 30,
		'#FFFFFF': 31
	}
	orders = []

	def rgb_to_hex(rgb):
		return '#' + (('%02x%02x%02x' % rgb).upper())

	for x in range(2000):
		for y in range(1000):
			colors = pix[x, y]
			if colors[3] == 0:
				continue
			hex = rgb_to_hex((colors[0], colors[1], colors[2]))
			colorid = color_mappings[hex]
			orders.append([x, y, colorid])
			formatted_orders += '[' + str(x) + ', ' + str(y) + ', ' + str(colorid) + '],\n'

	return formatted_orders

if (len(sys.argv) < 2):
	print("Usage: reference.py <number of reference files>")
	sys.exit(1)

file_count = int(sys.argv[1])
formatted_orders = "[\n"
for i in range(0, file_count):
	path = "reference" + str(i) + ".png"
	if (not exists(path)):
		print("File " + path + " does not exist")
		sys.exit(1)
	formatted_orders += gen_orders_for_image(path)

formatted_orders += ']'

print(formatted_orders)