"""
Utility functions for exporting expense data
"""
import csv
import io
from django.http import HttpResponse
from decimal import Decimal


def generate_csv_export(expenses, start_date, end_date, user):
    """Generate CSV export of expenses"""
    response = HttpResponse(content_type='text/csv; charset=utf-8')
    filename = f'expenses_export_{start_date}_{end_date}.csv'
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    
    # Add BOM for Excel compatibility
    response.write('\ufeff')
    
    writer = csv.writer(response)
    
    # Write header
    writer.writerow([
        'Date', 'Title', 'Description', 'Amount', 'Currency',
        'Category', 'Group', 'Paid By', 'Tags', 'Status', 'Created At'
    ])
    
    # Write data rows
    for expense in expenses:
        tags = ', '.join([tag.name for tag in expense.tags.all()])
        writer.writerow([
            expense.expense_date.isoformat() if expense.expense_date else '',
            expense.title or '',
            expense.description or '',
            str(expense.amount),
            expense.currency.code if expense.currency else '',
            expense.category.name if expense.category else '',
            expense.group.name if expense.group else '',
            expense.paid_by.get_full_name() or expense.paid_by.username,
            tags,
            'Settled' if expense.is_settled else 'Pending',
            expense.created_at.isoformat() if expense.created_at else '',
        ])
    
    return response


def generate_pdf_export(expenses, start_date, end_date, user):
    """Generate PDF export of expenses"""
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
    except ImportError:
        # Fallback to CSV if reportlab is not installed
        return generate_csv_export(expenses, start_date, end_date, user)
    
    # Create response
    response = HttpResponse(content_type='application/pdf')
    filename = f'expenses_export_{start_date}_{end_date}.pdf'
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    
    # Create PDF document
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=30,
        leftMargin=30,
        topMargin=30,
        bottomMargin=30
    )
    elements = []
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        textColor=colors.HexColor('#1976d2'),
        spaceAfter=12,
    )
    
    # Title
    title = Paragraph(f"Expense Report - {user.get_full_name() or user.username}", title_style)
    elements.append(title)
    
    # Period
    period_text = f"Period: {start_date.strftime('%B %d, %Y')} to {end_date.strftime('%B %d, %Y')}"
    elements.append(Paragraph(period_text, styles['Normal']))
    elements.append(Spacer(1, 0.2 * inch))
    
    # Summary
    total_amount = sum(expense.amount for expense in expenses)
    summary_data = [
        ['Total Expenses', f"${total_amount:.2f}"],
        ['Number of Expenses', str(len(expenses))],
        ['Average Expense', f"${(total_amount / len(expenses)):.2f}" if expenses else "$0.00"],
    ]
    summary_table = Table(summary_data, colWidths=[3 * inch, 2 * inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 0.3 * inch))
    
    # Expenses table
    if expenses:
        table_data = [['Date', 'Title', 'Amount', 'Category', 'Status']]
        
        for expense in expenses:
            table_data.append([
                expense.expense_date.strftime('%Y-%m-%d') if expense.expense_date else '',
                expense.title[:30] if expense.title else (expense.description[:30] if expense.description else ''),
                f"${expense.amount:.2f}",
                expense.category.name if expense.category else 'N/A',
                'Settled' if expense.is_settled else 'Pending',
            ])
        
        expenses_table = Table(table_data, colWidths=[1 * inch, 2.5 * inch, 1 * inch, 1.5 * inch, 1 * inch])
        expenses_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976d2')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (2, 1), (2, -1), 'RIGHT'),  # Right align amounts
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ]))
        elements.append(expenses_table)
    else:
        elements.append(Paragraph("No expenses found for this period.", styles['Normal']))
    
    # Build PDF
    doc.build(elements)
    pdf = buffer.getvalue()
    buffer.close()
    response.write(pdf)
    
    return response
