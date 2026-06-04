const predefinedProducts = [
    '1 Lit Beaker No.1', '1 Lit Beaker No.2', '1.5 Lit Beaker No.1', '1.5 Lit Beaker No.2',
    '2025 Brush Holder', '3 Lit Bucket', '5 Lit Bucket', 'Amazone Duppa', 'Big Fruit Basket',
    'Small Fruit Basket', 'Book Rack 5 Layer', 'Book Rack 7 Layer', 'Box Flower Pot 6001',
    'Curd Bucket with Lid', 'Dusbin 6003', 'Fruity Water Jug', 'Grapes Basin 6030 (14 Inch)',
    'Jasmin 2in1 SoapCase No.1', 'Jasmin 2in1 SoapCase No.2', 'King 10 Flower Pot',
    'Lion Bowl No.1', 'Lion Bowl No.2', 'Lion Duppa No.1', 'Lion Duppa No.2', 'Lunch Box',
    'Metikoppa 6040', 'Pineapple Tile Box', 'Silky Bowl No.1', 'Silky Bowl No.2',
    'SNS New Dustbin Large No.1', 'SNS New Dustbin Large No.2', 'SNS Stool No.1',
    'SNS Stool No.2', 'SNS Tea Cup', 'Star Basin No.1', 'Star Basin No.2',
    'Titanic Basket No.1', 'Titanic Basket No.2', 'Zinkwatti', '777 Tray No.1',
    '777 Tray No.2', '6006 Tray No.1', '6006 Tray No.2', 'SNS Visiri', 'Flower Plate',
    'Rani Soap Case 2014', '5001 Basin', '222 Basin', 'Ubag', 'Doll', 'Lovely Basket',
    '3 in 1', '6005 18cm Pot Black', '6005 18cm Pot White', '555 Plate No.1',
    '555 Plate No.2', 'Palawatty'
];

let session = null;
const INVOICES_STORAGE_KEY = 'sns_invoices';

// Local Storage helpers for Invoices
function getSavedInvoices() {
    try {
        const invoicesJson = localStorage.getItem(INVOICES_STORAGE_KEY);
        return invoicesJson ? JSON.parse(invoicesJson) : [];
    } catch (e) {
        console.error("Error loading invoices from localStorage", e);
        return [];
    }
}

function saveInvoice(invoice) {
    try {
        const invoices = getSavedInvoices();
        const index = invoices.findIndex(inv => inv.orderNum === invoice.orderNum);
        if (index > -1) {
            // Update existing invoice
            invoices[index] = invoice;
        } else {
            // Add new invoice to the beginning
            invoices.unshift(invoice);
        }
        localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(invoices));
    } catch (e) {
        console.error("Error saving invoice to localStorage", e);
    }
}

// Show a brief toast notification
let _toastTimer = null;
function showToast(message) {
    const toast = document.getElementById('save-toast');
    document.getElementById('save-toast-msg').textContent = message;
    toast.classList.add('show');
    if (_toastTimer) clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

// Global Edit/Delete action handlers called from HTML onClick
window.editInvoice = function (orderNum) {
    const invoices = getSavedInvoices();
    const invoice = invoices.find(inv => inv.orderNum === orderNum);
    if (!invoice) return;

    // Perform a deep copy of the invoice to the session
    session = JSON.parse(JSON.stringify(invoice));

    // Fill customer form fields
    $('#cust-name').val(session.customerName);
    $('#cust-company').val(session.company || '');
    $('#cust-mobile').val(session.mobile || '');

    // Hide customer details & history cards
    $('#customer-form').addClass('hidden');
    $('#recent-invoices-card').addClass('hidden');

    // Show order entry form and enable restart
    $('#order-entry-form').removeClass('hidden');
    $('#btn-restart').show();

    // Set headers
    $('#display-order-num').text(session.orderNum);
    $('#display-cust-name').text(session.customerName);
    $('#display-date').text(session.date);

    // Reset product input fields
    $('#product-select').val(null).trigger('change');
    $('#item-qty').val('');

    // Render the items
    renderAddedItems();

    // Enable proceed button if there are items
    $('#btn-proceed-adjustment').prop('disabled', session.items.length === 0);
    $('#btn-save-draft').prop('disabled', session.items.length === 0);
};

window.deleteInvoice = function (orderNum) {
    if (confirm(`Are you sure you want to delete invoice ${orderNum}?`)) {
        try {
            let invoices = getSavedInvoices();
            invoices = invoices.filter(inv => inv.orderNum !== orderNum);
            localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(invoices));
            renderRecentInvoices();
        } catch (e) {
            console.error("Error deleting invoice from localStorage", e);
        }
    }
};

function renderRecentInvoices() {
    const list = $('#recent-invoices-list');
    list.empty();

    const invoices = getSavedInvoices();
    if (invoices.length === 0) {
        list.append('<div class="history-empty">No recent invoices found. Start a new order above!</div>');
        return;
    }

    // Take the last 5 invoices (they are already sorted with most recent first)
    const recent = invoices.slice(0, 5);

    recent.forEach(inv => {
        const companyText = inv.company ? `<span class="history-item-company">(${inv.company})</span>` : '';
        const itemPlural = inv.items.length === 1 ? 'item' : 'items';

        list.append(`
            <div class="history-item">
                <div class="history-item-header">
                    <span class="history-item-order">${inv.orderNum}</span>
                    <span class="history-item-date">${inv.date}</span>
                </div>
                <div class="history-item-body">
                    <span class="history-item-customer">${inv.customerName}</span>
                    ${companyText}
                </div>
                <div class="history-item-meta">
                    ${inv.items.length} ${itemPlural}
                </div>
                <div class="history-item-actions">
                    <button class="btn btn-secondary btn-small" onclick="editInvoice('${inv.orderNum}')">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        Edit
                    </button>
                    <button class="btn-delete-link" onclick="deleteInvoice('${inv.orderNum}')">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        Delete
                    </button>
                </div>
            </div>
        `);
    });
}

$(document).ready(function () {
    // Render the initial recent invoices list
    renderRecentInvoices();

    // Initialize Select2
    $('#product-select').select2({
        data: predefinedProducts.map(p => ({ id: p, text: p })),
        placeholder: "Search for a product...",
        allowClear: true
    });

    // Start Order
    $('#btn-start-order').click(function () {
        const name = $('#cust-name').val().trim();
        if (!name) {
            alert('Customer Name is required!');
            return;
        }

        session = {
            orderNum: 'ORD-' + Date.now().toString().slice(-6),
            customerName: name,
            company: $('#cust-company').val(),
            mobile: $('#cust-mobile').val(),
            date: new Date().toLocaleDateString(),
            items: []
        };

        $('#customer-form').addClass('hidden');
        $('#recent-invoices-card').addClass('hidden');
        $('#order-entry-form').removeClass('hidden');
        $('#btn-restart').show();

        $('#display-order-num').text(session.orderNum);
        $('#display-cust-name').text(session.customerName);
        $('#display-date').text(session.date);
    });

    // Add Item
    $('#btn-add-item').click(function () {
        const product = $('#product-select').val();
        const qty = parseFloat($('#item-qty').val());
        const unit = $('#item-unit').val();

        if (!product || !qty || qty <= 0) {
            alert('Please select a product and enter a valid quantity.');
            return;
        }

        session.items.push({
            product: product,
            originalQty: qty,
            originalUnit: unit,
            finalQty: qty,
            finalUnit: unit
        });

        // Reset inputs
        $('#product-select').val(null).trigger('change');
        $('#item-qty').val('');

        renderAddedItems();
        const hasItems = session.items.length > 0;
        $('#btn-proceed-adjustment').prop('disabled', !hasItems);
        $('#btn-save-draft').prop('disabled', !hasItems);
    });

    // Proceed to Adjustment
    $('#btn-proceed-adjustment').click(function () {
        switchScreen('screen-adjustment', 'Adjust Quantities');
        renderAdjustmentItems();
    });

    // Save Draft (order entry screen)
    $('#btn-save-draft').click(function () {
        saveInvoice(session);
        renderRecentInvoices();
        showToast('Draft saved!');
    });

    // Save (adjustment screen)
    $('#btn-save-adj').click(function () {
        saveInvoice(session);
        renderRecentInvoices();
        showToast('Order saved!');
    });

    // Proceed to Summary
    $('#btn-proceed-summary').click(function () {
        // Save to LocalStorage before moving to summary
        saveInvoice(session);

        switchScreen('screen-summary', 'Order Summary');
        renderSummary();
    });

    // Restart Session
    $('#btn-restart').click(function () {
        if (confirm('Are you sure you want to start a new order? Current progress will be lost.')) {
            location.reload();
        }
    });

    // Export PDF
    $('#btn-save-pdf, #btn-share-pdf').click(async function () {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'pt', 'a4');

        const exportArea = document.getElementById('export-area');

        await html2canvas(exportArea, { scale: 2 }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdfWidth = doc.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

            const fileName = `SNS_Order_${session.orderNum}.pdf`;

            if (this.id === 'btn-share-pdf' && navigator.share && navigator.canShare) {
                // To share PDF via Web Share API, we need a File object
                const pdfBlob = doc.output('blob');
                const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

                if (navigator.canShare({ files: [file] })) {
                    navigator.share({
                        files: [file],
                        title: 'Order Summary',
                        text: 'Here is the final adjusted order sheet.'
                    }).catch(console.error);
                    return;
                }
            }

            doc.save(fileName);
        });
    });

    // Export Image
    $('#btn-save-img, #btn-share-img').click(async function () {
        const exportArea = document.getElementById('export-area');
        await html2canvas(exportArea, { scale: 2 }).then(canvas => {
            const fileName = `SNS_Order_${session.orderNum}.png`;

            canvas.toBlob(blob => {
                if (this.id === 'btn-share-img' && navigator.share && navigator.canShare) {
                    const file = new File([blob], fileName, { type: 'image/png' });
                    if (navigator.canShare({ files: [file] })) {
                        navigator.share({
                            files: [file],
                            title: 'Order Summary',
                            text: 'Here is the final adjusted order sheet.'
                        }).catch(console.error);
                        return;
                    }
                }

                // Save to downloads fallback
                const link = document.createElement('a');
                link.download = fileName;
                link.href = canvas.toDataURL('image/png');
                link.click();
            });
        });
    });
});

function switchScreen(screenId, title) {
    $('.screen').removeClass('active');
    $(`#${screenId}`).addClass('active');
    $('#header-title').text(title);
}

function renderAddedItems() {
    const list = $('#added-items-list');
    list.empty();

    session.items.forEach((item, index) => {
        list.append(`
            <div class="item-card">
                <div class="item-title">${item.product}</div>
                <div class="item-details">
                    <span>${item.originalQty} ${item.originalUnit}</span>
                    <button class="btn-icon" style="color:var(--color-red);" onclick="removeItem(${index})" title="Remove">
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            </div>
        `);
    });
}

window.removeItem = function (index) {
    session.items.splice(index, 1);
    renderAddedItems();
    const hasItems = session.items.length > 0;
    if (!hasItems) $('#btn-proceed-adjustment').prop('disabled', true);
    $('#btn-save-draft').prop('disabled', !hasItems);
}

function renderAdjustmentItems() {
    const list = $('#adjustment-list');
    list.empty();

    session.items.forEach((item, index) => {
        list.append(`
            <div class="item-card" id="adj-card-${index}">
                <div class="item-title">${item.product}</div>
                <div class="item-details">
                    <span>Ordered: ${item.originalQty} ${item.originalUnit}</span>
                    <span id="diff-badge-${index}" class="diff-badge" style="background: var(--color-green);">0</span>
                </div>
                <div class="adj-row">
                    <input type="number" class="adj-input" value="${item.finalQty}" min="0" step="0.1" oninput="updateQty(${index}, this.value)">
                    <div id="status-dot-${index}" class="status-dot"></div>
                </div>
            </div>
        `);
    });
}

window.updateQty = function (index, value) {
    const newQty = parseFloat(value) || 0;
    session.items[index].finalQty = newQty;

    const orig = session.items[index].originalQty;
    const diff = newQty - orig;

    let color = 'var(--color-orange)';
    if (newQty === orig) color = 'var(--color-green)';
    if (newQty === 0) color = 'var(--color-red)';

    $(`#status-dot-${index}`).css('background', color);
    $(`#status-dot-${index}`).css('box-shadow', `0 0 0 4px ${color}33`);

    const badge = $(`#diff-badge-${index}`);
    badge.css('background', color);
    badge.text(`${diff > 0 ? '+' : ''}${diff}`);
}

function renderSummary() {
    $('#summary-cust-name').text(session.customerName);
    $('#summary-order-num').text(session.orderNum);
    $('#summary-date').text(session.date);

    const tbody = $('#summary-table-body');
    tbody.empty();

    session.items.forEach(item => {
        const diff = item.finalQty - item.originalQty;
        tbody.append(`
            <tr>
                <td>${item.product}</td>
                <td>${item.originalQty} ${item.originalUnit}</td>
                <td>${item.finalQty} ${item.finalUnit}</td>
                <td style="color:${diff < 0 ? 'red' : 'inherit'}; font-weight:bold;">${diff > 0 ? '+' : ''}${diff}</td>
            </tr>
        `);
    });

    $('#summary-total-items').text(session.items.length);
}
