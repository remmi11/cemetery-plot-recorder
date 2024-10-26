


def drawText(canvasObj, text, length, x, y, line_space=22):
	if text == "":
		return 1
	wraped_text = wrap(text, length)
	for index in range(0, len(wraped_text)):
		canvasObj.drawString(x, y-(index+1)*line_space, wraped_text[index])

	return len(wraped_text)

def drawNotes(canvasObj, text, x, y, line_space=15):
	text_list = text.split("\n")
	if text == "":
		return 1

	y -= 10
	length = 0
	for txt in text_list:	
		wraped_text = wrap(txt, 30)
		for index in range(0, len(wraped_text)):
			canvasObj.drawString(x, y-(index+1)*line_space, wraped_text[index])
		length += len(wraped_text)
		y = y-len(wraped_text)*line_space - 5

	return length

def clean(data):
	return "" if data == None else data

def cleanDate(data):
	try:
		return data.strftime('%m/%d/%Y')
	except:
		return ""


def getpdf(request, pk):
	post = get_object_or_404(CemeteryPlot, pk=pk)

	response = HttpResponse(content_type='application/pdf')
	response['Content-Disposition'] = 'filename="%sWO.pdf"' % post.project_no

	try:
		start_x = 50
		# start_y = 640
		start_y = 700
		line_space = 25
		bgColor = colors.Color(red=(211.0/255),green=(211.0/255),blue=(211.0/255))

		canvas1 = canvas.Canvas(response, pagesize=letter)
		canvas1.setLineWidth(.3)

		canvas1.setFont('Helvetica-Bold', 15)
		canvas1.drawString(start_x+140,start_y+40, clean(post.collection.replace("Surveyers", "Surveyors")))
		# canvas1.drawString(start_x+140,start_y+40, clean('Template'))

		canvas1.setFont('Helvetica', 12)
		 
		canvas1.drawString(start_x+50,start_y,'Date Created %s' % cleanDate(post.date_entered))

		canvas1.setFillColor(bgColor)
		canvas1.rect(start_x-10,start_y-65,270,20, fill=True, stroke=False)
		canvas1.setFillColor(colors.black)
		canvas1.drawString(start_x, start_y-60,'Client Info')

		offsetY = start_y-60
		canvas1.drawString(start_x, offsetY-line_space,'Client')
		lines = drawText(canvas1, clean(post.client), 17, start_x+130, offsetY)
		offsetY = offsetY-lines*line_space

		canvas1.drawString(start_x, offsetY-line_space,'Contact')
		lines = drawText(canvas1, clean(post.contact_name), 17, start_x+130, offsetY)
		offsetY = offsetY-lines*line_space

		canvas1.drawString(start_x, offsetY-line_space,'Client Address')
		lines = drawText(canvas1, clean(post.contact_address), 17, start_x+130, offsetY)
		offsetY = offsetY-lines*line_space

		canvas1.drawString(start_x, offsetY-line_space,'Phone')
		lines = drawText(canvas1, clean(post.contact_phone), 17, start_x+130, offsetY)
		offsetY = offsetY-lines*line_space

		offsetY = offsetY-lines*line_space - 30
		canvas1.setFillColor(bgColor)
		canvas1.rect(start_x-10,offsetY-5,270,20, fill=True, stroke=False)
		canvas1.setFillColor(colors.black)
		canvas1.drawString(start_x, offsetY,'Job Location')

		canvas1.drawString(start_x, offsetY-line_space,'Map No')
		lines = drawText(canvas1, clean(post.map_no), 15, start_x+140, offsetY)
		offsetY = offsetY-lines*line_space

		canvas1.drawString(start_x, offsetY-line_space,'Address')
		lines = drawText(canvas1, clean(post.situs_street), 15, start_x+140, offsetY)
		offsetY = offsetY-lines*line_space

		canvas1.drawString(start_x, offsetY-line_space,'City')
		lines = drawText(canvas1, clean(post.situs_city), 15, start_x+140, offsetY)
		offsetY = offsetY-lines*line_space

		canvas1.drawString(start_x, offsetY-line_space,'State')
		lines = drawText(canvas1, clean(post.situs_state), 15, start_x+140, offsetY)
		offsetY = offsetY-lines*line_space

		offsetY = offsetY - 30 - lines*line_space
		canvas1.setFillColor(bgColor)
		canvas1.rect(start_x-10,offsetY-5,270,20, fill=True, stroke=False)
		canvas1.setFillColor(colors.black)
		canvas1.drawString(start_x, offsetY,'Notes')

		lines = drawNotes(canvas1, clean(post.notes), start_x, offsetY)
		offsetY = offsetY-lines*line_space-80

		start_x = 310
		canvas1.setFont('Helvetica-Bold', 12)
		canvas1.drawString(start_x+60,start_y,'Survey Work Order')
		canvas1.line(start_x+60,start_y-2,start_x+165,start_y-2)

		offsetY = start_y #- 15
		canvas1.setFont('Helvetica', 12)
		canvas1.drawString(start_x+60, offsetY-18,'Project #')
		lines = drawText(canvas1, clean(post.project_no), 17, start_x+150, offsetY, 20)
		offsetY = offsetY-lines*18

		canvas1.drawString(start_x+60, offsetY-18,'Map #')
		lines = drawText(canvas1, clean(post.map_no), 17, start_x+150, offsetY, 20)
		offsetY = offsetY-lines*18

		canvas1.drawString(start_x+60, offsetY-18,'Date Needed')
		lines = drawText(canvas1, clean(post.date_needed), 17, start_x+150, offsetY, 20)
		offsetY = offsetY-lines*18

		canvas1.drawString(start_x+60, offsetY-18,'Requested By')
		lines = drawText(canvas1, clean(post.requested_by), 17, start_x+150, offsetY, 20)
		offsetY = offsetY-lines*18

		offsetY = offsetY - 40
		start_x = start_x + 12
		canvas1.setFillColor(bgColor)
		canvas1.rect(start_x-10,offsetY-5,270,20, fill=True, stroke=False)
		canvas1.setFillColor(colors.black)
		canvas1.drawString(start_x, offsetY,'Reference Info')

		canvas1.drawString(start_x, offsetY-line_space,'Certify To')
		lines = drawText(canvas1, clean(post.certify_to), 17, start_x+130, offsetY)
		offsetY = offsetY-lines*line_space

		canvas1.drawString(start_x, offsetY-line_space,'Lender')
		lines = drawText(canvas1, clean(post.lender), 17, start_x+130, offsetY)
		offsetY = offsetY-lines*line_space

		canvas1.drawString(start_x, offsetY-line_space,'Gf#')
		lines = drawText(canvas1, clean(post.gf_no), 17, start_x+130, offsetY)
		offsetY = offsetY-lines*line_space

		canvas1.drawString(start_x, offsetY-line_space,'Clerksfile#')
		lines = drawText(canvas1, clean(post.clerksfile), 17, start_x+130, offsetY)
		offsetY = offsetY-lines*line_space

		canvas1.drawString(start_x, offsetY-line_space,'Volume')
		lines = drawText(canvas1, clean(post.book), 17, start_x+130, offsetY)
		offsetY = offsetY-lines*line_space

		canvas1.drawString(start_x, offsetY-line_space,'Page')
		lines = drawText(canvas1, clean(post.page), 17, start_x+130, offsetY)
		offsetY = offsetY-lines*line_space

		canvas1.drawString(start_x, offsetY-line_space,'Well Name')
		lines = drawText(canvas1, clean(post.well_name), 17, start_x+130, offsetY)
		offsetY = offsetY-lines*line_space

		canvas1.drawString(start_x, offsetY-line_space,'Well Number')
		lines = drawText(canvas1, clean(post.well_number), 17, start_x+130, offsetY)
		offsetY = offsetY-lines*line_space

		offsetY = offsetY - 45
		canvas1.setFillColor(bgColor)
		canvas1.rect(start_x-10,offsetY-5,270,20, fill=True, stroke=False)
		canvas1.setFillColor(colors.black)
		canvas1.drawString(start_x, offsetY,'Legal')

		# line_space = 18
		canvas1.drawString(start_x, offsetY-line_space,'County')
		lines = drawText(canvas1, clean(post.county), 17, start_x+130, offsetY)
		offsetY = offsetY-lines*line_space

		if post.join_type == "residential":
			canvas1.drawString(start_x, offsetY-line_space,'Subdivision')
			lines = drawText(canvas1, clean(post.sub_name), 17, start_x+130, offsetY)
			offsetY = offsetY-lines*line_space

			canvas1.drawString(start_x, offsetY-line_space,'Unit')
			lines = drawText(canvas1, clean(post.sub_unit), 17, start_x+130, offsetY)
			offsetY = offsetY-lines*line_space

			canvas1.drawString(start_x, offsetY-line_space,'Block')
			lines = drawText(canvas1, clean(post.sub_block), 17, start_x+130, offsetY)
			offsetY = offsetY-lines*line_space

			canvas1.drawString(start_x, offsetY-line_space,'Lot')
			lines = drawText(canvas1, clean(post.sub_lot), 17, start_x+130, offsetY)
			offsetY = offsetY-lines*line_space
		elif post.join_type == "plss":
			canvas1.drawString(start_x, offsetY-line_space,'Meridian')
			lines = drawText(canvas1, clean(post.plss_meridian), 17, start_x+130, offsetY)
			offsetY = offsetY-lines*line_space

			canvas1.drawString(start_x, offsetY-line_space,'Twnshp/Range')
			lines = drawText(canvas1,clean(post.plss_t_r), 17, start_x+130, offsetY)
			offsetY = offsetY-lines*line_space

			canvas1.drawString(start_x, offsetY-line_space,'Section')
			lines = drawText(canvas1, clean(post.plss_section), 17, start_x+130, offsetY)
			offsetY = offsetY-lines*line_space
		elif post.join_type == "rural":
			canvas1.drawString(start_x, offsetY-line_space,'Survey')
			lines = drawText(canvas1, clean(post.rural_survey), 17, start_x+130, offsetY)
			offsetY = offsetY-lines*line_space

			canvas1.drawString(start_x, offsetY-line_space,'Block')
			lines = drawText(canvas1, clean(post.rural_block), 17, start_x+130, offsetY)
			offsetY = offsetY-lines*line_space

			canvas1.drawString(start_x, offsetY-line_space,'Section')
			lines = drawText(canvas1, clean(post.rural_section), 17, start_x+130, offsetY)
			offsetY = offsetY-lines*line_space
	except:
		pass

	canvas1.save()
	return response