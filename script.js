const translations = {
    en: {
        companyName: "AV Electrical Services",
        businessType: "Electrical Services",
        invoiceTitle: "INVOICE",
        newInvoice: "⟳ New Invoice",
        billTo: "Bill To:",
        customerNamePlaceholder: "Customer Name",
        addressPlaceholder: "Street Address",
        cityPlaceholder: "City",
        zipPlaceholder: "Postal Code",
        invoiceNo: "Invoice #",
        dateLabel: "Date",
        colItem: "Item & Description",
        colQty: "Msg/Qty",
        colPrice: "Price (₹)",
        colTax: "Tax (%)",
        colTotal: "Amount (₹)",
        addItem: "+ Add Line Item",
        subtotal: "Subtotal",
        taxTotal: "Tax Total",
        total: "Total",
        printSave: "Print / Save as PDF",
        developedBy: "Developed by",
        company: "company"
    },
    mr: {
        companyName: "एव्ही इलेक्ट्रिकल सर्विसेस",
        businessType: "इलेक्ट्रिकल सर्विसेस",
        invoiceTitle: "इनव्हॉइस",
        newInvoice: "⟳ नवीन इनव्हॉइस",
        billTo: "बिल कोणास:",
        customerNamePlaceholder: "ग्राहकाचे नाव",
        addressPlaceholder: "पत्ता",
        cityPlaceholder: "शहर",
        zipPlaceholder: "पिन कोड",
        invoiceNo: "इनव्हॉइस क्र.",
        dateLabel: "दिनांक",
        colItem: "तपशील आणि वर्णन",
        colQty: "नग/संख्या",
        colPrice: "दर (₹)",
        colTax: "कर (%)",
        colTotal: "रक्कम (₹)",
        addItem: "+ नवीन आयटम जोडा",
        subtotal: "एकूण रक्कम",
        taxTotal: "एकूण कर",
        total: "एकूण",
        printSave: "प्रिंट / पीडीएफ म्हणून जतन करा",
        developedBy: "विकसित",
        company: "कंपनी"
    }
};

let currentLang = 'en';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize (Load from storage or defaults)
    initInvoice();

    // 2. Global Event Listeners for Auto-save
    // We listen to 'input' on the main container to catch all localized changes
    document.querySelector('.invoice-container').addEventListener('input', () => {
        calculateTotals();
        saveInvoiceData();
    });

    // 3. Specific Action Buttons
    document.getElementById('add-item-btn').addEventListener('click', () => {
        addItemRow();
        saveInvoiceData();
    });

    document.getElementById('items-body').addEventListener('click', handleRowActions);
    document.getElementById('print-btn').addEventListener('click', () => window.print());

    // New Invoice Button
    document.getElementById('new-invoice-btn').addEventListener('click', resetInvoice);

    // Language Toggle
    document.getElementById('lang-toggle').addEventListener('click', toggleLanguage);
});

function initInvoice() {
    const savedData = localStorage.getItem('av_invoice_data');
    const savedLang = localStorage.getItem('av_invoice_lang');

    if (savedLang) {
        currentLang = savedLang;
    }
    updateLanguageUI();

    if (savedData) {
        restoreInvoice(JSON.parse(savedData));
    } else {
        // Default Initialization
        document.getElementById('invoice-date').value = new Date().toISOString().split('T')[0];
        generateInvoiceNumber();
        addItemRow(); // One empty row
    }
}

function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'mr' : 'en';
    localStorage.setItem('av_invoice_lang', currentLang);
    updateLanguageUI();
}

function updateLanguageUI() {
    // Update Text Content
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[currentLang][key]) {
            element.textContent = translations[currentLang][key];
        }
    });

    // Update Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (translations[currentLang][key]) {
            element.placeholder = translations[currentLang][key];
        }
    });

    // Update Toggle Button Text
    const btn = document.getElementById('lang-toggle');
    if (currentLang === 'en') {
        btn.textContent = "🌐 English / मराठी"; // Shows option to switch TO
    } else {
        btn.textContent = "🌐 मराठी / English";
    }
}


function generateInvoiceNumber() {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const dateString = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    document.getElementById('invoice-number').value = `INV-${dateString}-${randomSuffix}`;
}

function addItemRow(data = {}) {
    const tbody = document.getElementById('items-body');
    const row = document.createElement('tr');
    row.classList.add('item-row');

    // Use saved values or defaults
    const name = data.name || '';
    const desc = data.desc || '';
    const qty = data.qty || '1';
    const price = data.price || '0.00';
    const tax = data.tax || '0';

    row.innerHTML = `
        <td>
            <input type="text" class="item-name" placeholder="Item Name" value="${name}">
            <input type="text" class="item-desc" placeholder="Description (optional)" value="${desc}">
        </td>
        <td>
            <input type="number" class="qty-input" value="${qty}" min="0">
        </td>
        <td>
            <input type="number" class="price-input" value="${price}" min="0" step="0.01">
        </td>
        <td>
            <input type="number" class="tax-input" value="${tax}" min="0" max="100" step="0.1">
        </td>
        <td>
            <span class="row-amount">₹0.00</span>
        </td>
        <td class="col-action print-hidden">
            <button class="btn-remove" title="Remove Item">&times;</button>
        </td>
    `;

    tbody.appendChild(row);
    calculateTotals(); // Recalculate immediately to update row amount
}

function handleRowActions(e) {
    if (e.target.classList.contains('btn-remove')) {
        const row = e.target.closest('tr');
        row.remove();
        calculateTotals();
        saveInvoiceData();
    }
}

function calculateTotals() {
    const rows = document.querySelectorAll('.item-row');
    let subTotal = 0;
    let totalTax = 0;

    rows.forEach(row => {
        let valQty = parseFloat(row.querySelector('.qty-input').value);
        let valPrice = parseFloat(row.querySelector('.price-input').value);
        let valTax = parseFloat(row.querySelector('.tax-input').value);

        // Validation
        if (valQty < 0) { row.querySelector('.qty-input').value = 0; valQty = 0; }
        if (valPrice < 0) { row.querySelector('.price-input').value = 0; valPrice = 0; }
        if (valTax < 0) { row.querySelector('.tax-input').value = 0; valTax = 0; }

        const qty = valQty || 0;
        const price = valPrice || 0;
        const taxRate = valTax || 0;

        const baseAmount = qty * price;
        const taxAmount = (baseAmount * taxRate) / 100;

        // Update Row Amount
        row.querySelector('.row-amount').textContent = formatCurrency(baseAmount);

        subTotal += baseAmount;
        totalTax += taxAmount;
    });

    const grandTotal = subTotal + totalTax;

    document.getElementById('subtotal-display').textContent = formatCurrency(subTotal);
    document.getElementById('tax-total-display').textContent = formatCurrency(totalTax);
    document.getElementById('grand-total-display').textContent = formatCurrency(grandTotal);
}

function formatCurrency(num) {
    // Indian Currency Formatting (e.g. 1,00,000.00)
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num);
}

function saveInvoiceData() {
    const data = {
        customerName: document.getElementById('customer-name').value,
        customerAddress: document.getElementById('customer-address').value,
        customerCity: document.getElementById('customer-city').value,
        customerZip: document.getElementById('customer-zip').value,
        invoiceNum: document.getElementById('invoice-number').value,
        invoiceDate: document.getElementById('invoice-date').value,
        // notes: document.getElementById('notes').value, // Notes section is commented out in HTML
        items: []
    };

    document.querySelectorAll('.item-row').forEach(row => {
        data.items.push({
            name: row.querySelector('.item-name').value,
            desc: row.querySelector('.item-desc').value,
            qty: row.querySelector('.qty-input').value,
            price: row.querySelector('.price-input').value,
            tax: row.querySelector('.tax-input').value
        });
    });

    localStorage.setItem('av_invoice_data', JSON.stringify(data));
}

function restoreInvoice(data) {
    document.getElementById('customer-name').value = data.customerName || '';
    document.getElementById('customer-address').value = data.customerAddress || '';
    document.getElementById('customer-city').value = data.customerCity || '';
    document.getElementById('customer-zip').value = data.customerZip || '';
    document.getElementById('invoice-number').value = data.invoiceNum || '';
    document.getElementById('invoice-date').value = data.invoiceDate || '';
    // document.getElementById('notes').value = data.notes || ''; // Notes section is commented out in HTML

    // Clear existing rows
    document.getElementById('items-body').innerHTML = '';

    // Add rows from save
    if (data.items && data.items.length > 0) {
        data.items.forEach(item => addItemRow(item));
    } else {
        addItemRow();
    }
}

function resetInvoice() {
    if (confirm('Are you sure you want to revert to a new blank invoice? This will clear current changes.')) {
        localStorage.removeItem('av_invoice_data');

        // Reset Inputs
        document.getElementById('customer-name').value = '';
        document.getElementById('customer-address').value = '';
        document.getElementById('customer-city').value = '';
        document.getElementById('customer-zip').value = '';
        // document.getElementById('notes').value = '';

        document.getElementById('invoice-date').value = new Date().toISOString().split('T')[0];
        generateInvoiceNumber();

        // Reset Table
        document.getElementById('items-body').innerHTML = '';
        addItemRow();

        calculateTotals();
    }
}
