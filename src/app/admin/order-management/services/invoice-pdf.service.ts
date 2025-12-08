import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { OrderDetailDto, OrderItemDto } from '../../../core/service/system-admin.service';
import { OrderStatusMapper } from '../models';

@Injectable({
    providedIn: 'root'
})
export class InvoicePdfService {

    /**
     * Xuất hóa đơn PDF cho đơn hàng
     */
    exportInvoice(order: OrderDetailDto): void {
        const doc = new jsPDF();

        // Thiết lập font và màu sắc
        const primaryColor: [number, number, number] = [102, 126, 234]; // #667eea
        const textColor: [number, number, number] = [51, 51, 51];
        const lightGray: [number, number, number] = [245, 245, 245];

        let yPos = 20;

        // ========== HEADER ==========
        // Logo/Tên công ty
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 220, 45, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(28);
        doc.setFont('arial', 'bold');
        doc.text('GROCERYMART', 20, 25);

        doc.setFontSize(10);
        doc.setFont('arial', 'normal');
        doc.text('Hệ thống website thương mại điện tử', 20, 35);

        // Tiêu đề hóa đơn
        doc.setFontSize(16);
        doc.setFont('arial', 'bold');
        doc.text('HOÁ ĐƠN BÁN HÀNG', 150, 25, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('arial', 'normal');
        doc.text(`SỐ HOÁ ĐƠN: ${order.orderNumber || 'N/A'}`, 150, 35, { align: 'center' });

        yPos = 55;

        // ========== THÔNG TIN CÔNG TY & KHÁCH HÀNG ==========
        doc.setTextColor(...textColor);

        // Thông tin công ty (bên trái)
        doc.setFontSize(10);
        doc.setFont('arial', 'bold');
        doc.text('Thông tin cửa hàng:', 20, yPos);

        doc.setFont('arial', 'normal');
        doc.setFontSize(9);
        yPos += 6;
        doc.text('GROCERY ECOMMERCE CO., LTD', 20, yPos);
        yPos += 5;
        doc.text('Địa chỉ: 28 Phố Nhổn, Từ Liêm, Hà Nội, Việt Nam', 20, yPos);
        yPos += 5;
        doc.text('Hotline: (0367) 111 302 ', 20, yPos);
        yPos += 5;
        doc.text('Email: support@groceryecommerce.com', 20, yPos);

        // Thông tin khách hàng (bên phải)
        let yPosRight = 55;
        doc.setFontSize(10);
        doc.setFont('arial', 'bold');
        doc.text('Thông tin khách hàng:', 115, yPosRight);

        doc.setFont('arial', 'normal');
        doc.setFontSize(9);
        yPosRight += 6;
        doc.text(`Tên: ${order.userName || 'Trống'}`, 115, yPosRight);
        yPosRight += 5;
        doc.text(`Email: ${order.userEmail || 'Trống'}`, 115, yPosRight);
        yPosRight += 5;
        const shippingAddr = order.shippingFullAddress || 'Không có';
        const maxWidth = 80;
        const wrappedAddr = doc.splitTextToSize(`Địa chỉ: ${shippingAddr}`, maxWidth);
        doc.text(wrappedAddr, 115, yPosRight);

        yPos = Math.max(yPos, yPosRight + (wrappedAddr.length * 5)) + 10;

        // ========== THÔNG TIN ĐƠN HÀNG ==========
        // Đường kẻ phân cách
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(0.5);
        doc.line(20, yPos, 190, yPos);
        yPos += 8;

        // Thông tin đơn hàng
        doc.setFillColor(...lightGray);
        doc.roundedRect(20, yPos, 170, 25, 3, 3, 'F');

        yPos += 7;
        doc.setFontSize(9);
        doc.setTextColor(...textColor);

        // Row 1
        doc.setFont('arial', 'bold');
        doc.text('Mã đơn hàng:', 25, yPos);
        doc.setFont('arial', 'normal');
        doc.text(order.orderNumber || 'N/A', 60, yPos);

        doc.setFont('arial', 'bold');
        doc.text('Ngày đặt:', 115, yPos);
        doc.setFont('arial', 'normal');
        doc.text(this.formatDate(order.orderDate), 145, yPos);

        yPos += 7;

        // Row 2
        doc.setFont('arial', 'bold');
        doc.text('Trạng thái:', 25, yPos);
        doc.setFont('arial', 'normal');
        doc.text(OrderStatusMapper.getOrderStatusDisplay(order.status || 1), 60, yPos);

        doc.setFont('arial', 'bold');
        doc.text('Thanh toán:', 115, yPos);
        doc.setFont('arial', 'normal');
        doc.text(OrderStatusMapper.getPaymentStatusDisplay(order.paymentStatus || 1), 145, yPos);

        yPos += 7;

        // Row 3
        doc.setFont('arial', 'bold');
        doc.text('Phương thức thanh toán:', 25, yPos);
        doc.setFont('arial', 'normal');
        doc.text(OrderStatusMapper.getPaymentMethodDisplay(order.paymentMethod || 4), 60, yPos);

        yPos += 15;

        // ========== BẢNG SẢN PHẨM ==========
        doc.setFontSize(11);
        doc.setFont('arial', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('CHI TIẾT SẢN PHẨM', 20, yPos);
        yPos += 5;

        // Chuẩn bị dữ liệu cho bảng
        const tableData = (order.items || []).map((item: OrderItemDto, index: number) => [
            (index + 1).toString(),
            item.productName || 'N/A',
            item.productSku || '-',
            (item.quantity || 0).toString(),
            this.formatCurrency(item.unitPrice || 0),
            this.formatCurrency(item.totalPrice || 0)
        ]);

        // Vẽ bảng sản phẩm
        autoTable(doc, {
            startY: yPos,
            head: [['STT', 'Tên sản phẩm', 'Mã SP', 'SL', 'Đơn giá', 'Thành tiền']],
            body: tableData,
            theme: 'striped',
            headStyles: {
                fillColor: primaryColor,
                textColor: [255, 255, 255],
                fontSize: 9,
                fontStyle: 'bold',
                halign: 'center'
            },
            bodyStyles: {
                fontSize: 8,
                textColor: textColor
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 12 },
                1: { halign: 'left', cellWidth: 60 },
                2: { halign: 'center', cellWidth: 25 },
                3: { halign: 'center', cellWidth: 15 },
                4: { halign: 'right', cellWidth: 30 },
                5: { halign: 'right', cellWidth: 35 }
            },
            margin: { left: 20, right: 20 },
            styles: {
                overflow: 'linebreak',
                cellPadding: 3
            }
        });

        // Lấy vị trí Y sau bảng
        yPos = (doc as any).lastAutoTable.finalY + 10;

        // ========== TỔNG CỘNG ==========
        const summaryX = 115;
        const valueX = 185;

        // Box tổng tiền
        doc.setFillColor(...lightGray);
        doc.roundedRect(110, yPos - 5, 80, 45, 3, 3, 'F');

        doc.setFontSize(9);
        doc.setTextColor(...textColor);

        // Tạm tính
        doc.setFont('arial', 'normal');
        doc.text('Tạm tính:', summaryX, yPos);
        doc.text(this.formatCurrency(order.subTotal || 0), valueX, yPos, { align: 'right' });
        yPos += 7;

        // Phí vận chuyển
        doc.text('Phí vận chuyển:', summaryX, yPos);
        doc.text(this.formatCurrency(order.shippingAmount || 0), valueX, yPos, { align: 'right' });
        yPos += 7;

        // Thuế
        doc.text('Thuế:', summaryX, yPos);
        doc.text(this.formatCurrency(order.taxAmount || 0), valueX, yPos, { align: 'right' });
        yPos += 7;

        // Giảm giá
        if (order.discountAmount && order.discountAmount > 0) {
            doc.setTextColor(220, 53, 69); // Màu đỏ cho giảm giá
            doc.text('Giảm giá:', summaryX, yPos);
            doc.text(`-${this.formatCurrency(order.discountAmount)}`, valueX, yPos, { align: 'right' });
            yPos += 7;
        }

        // Đường kẻ
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(0.3);
        doc.line(summaryX, yPos, valueX, yPos);
        yPos += 5;

        // Tổng cộng
        doc.setFontSize(11);
        doc.setFont('arial', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('TỔNG CỘNG:', summaryX, yPos);
        doc.text(this.formatCurrency(order.totalAmount || 0), valueX, yPos, { align: 'right' });

        yPos += 20;

        // ========== GHI CHÚ ==========
        if (order.notes) {
            doc.setFontSize(9);
            doc.setFont('arial', 'bold');
            doc.setTextColor(...textColor);
            doc.text('Ghi chú:', 20, yPos);
            doc.setFont('arial', 'normal');
            const notesText = doc.splitTextToSize(order.notes, 170);
            doc.text(notesText, 20, yPos + 5);
            yPos += 5 + (notesText.length * 5);
        }

        // ========== FOOTER ==========
        // Kiểm tra nếu cần thêm trang mới
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        } else {
            yPos = 260;
        }

        // Đường kẻ footer
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(20, yPos, 190, yPos);
        yPos += 8;

        // Thông tin footer
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.setFont('arial', 'italic');
        doc.text('Cảm ơn quý khách đã mua hàng tại GROCERY STORE!', 105, yPos, { align: 'center' });
        yPos += 5;
        doc.text('Mọi thắc mắc xin liên hệ hotline: (0367) 111 302 hoặc email: support@grocerystore.com', 105, yPos, { align: 'center' });
        yPos += 5;
        doc.text(`Hoá đơn được xuất ngày: ${this.formatDate(new Date())}`, 105, yPos, { align: 'center' });

        // Lưu file PDF
        const fileName = `HoaDon_${order.orderNumber || order.orderId}_${this.formatDateForFileName(new Date())}.pdf`;
        doc.save(fileName);
    }

    /**
     * Format ngày tháng cho hiển thị
     */
    private formatDate(date?: Date | string | null): string {
        if (!date) return 'N/A';
        const d = new Date(date);
        return d.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Format ngày cho tên file
     */
    private formatDateForFileName(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}${month}${day}_${hours}${minutes}`;
    }

    /**
     * Format số tiền
     */
    private formatCurrency(amount: number): string {
        return new Intl.NumberFormat('vi-VN', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount) + ' VND';
    }
}
