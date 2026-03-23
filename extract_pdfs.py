import PyPDF2
import shutil

print('Processing LEASE...')
reader = PyPDF2.PdfReader('MARZO  LEASE (1).pdf')
print('LEASE PAGES:', len(reader.pages))
text = '\n'.join([p.extract_text() for p in reader.pages])
with open('lease_content.txt', 'w', encoding='utf-8') as f:
    f.write(text)

print('Processing COMPRA...')
reader2 = PyPDF2.PdfReader('MARZO (1).pdf')
print('COMPRA PAGES:', len(reader2.pages))
text2 = '\n'.join([p.extract_text() for p in reader2.pages])
with open('compra_content.txt', 'w', encoding='utf-8') as f:
    f.write(text2)

shutil.copy('MARZO  LEASE (1).pdf', 'lease.pdf')
shutil.copy('MARZO (1).pdf', 'compra.pdf')

print('¡LISTO! ARCHIVOS EXTRAÍDOS Y REEMPLAZADOS.')
