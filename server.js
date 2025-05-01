require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static('public', {
    index: false // Disable automatic serving of index.html
}));

// Initialize Google Sheets API with service account
const auth = new google.auth.GoogleAuth({
    keyFile: 'account-458406-62c589c33286.json', // Updated to use new service account file
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

// Initialize sheets API
const sheets = google.sheets({ version: 'v4', auth });

// Serve dashboard.html as the default page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Serve other HTML pages
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/party_master', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'party_master.html'));
});

app.get('/product_master', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'product_master.html'));
});

app.get('/incoming_bills', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'incoming_bills.html'));
});

app.get('/view_bills', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'view_bills.html'));
});

// Serve outgoing bills page
app.get('/outgoing_bills', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'outgoing_bills.html'));
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is working!' });
});

// Function to get the next S.No
async function getNextSNo() {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
            range: 'party_master!A:A',
        });

        const values = response.data.values || [];
        // Skip header row, count existing rows
        const nextSNo = values.length;
        return nextSNo;
    } catch (error) {
        console.error('Error getting next S.No:', error);
        throw error;
    }
}

// Route to get data from Google Sheets
app.get('/api/data', async (req, res) => {
    try {
        console.log('Attempting to fetch data from Google Sheets...');
        console.log('Spreadsheet ID:', process.env.GOOGLE_SHEETS_SPREADSHEET_ID);
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
            range: 'party_master!A:D',
        });

        console.log('Successfully fetched data:', response.data);
        // Skip the header row
        const data = response.data.values ? response.data.values.slice(1) : [];
        res.json(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        console.error('Error details:', error.response ? error.response.data : error);
        res.status(500).json({ error: 'Failed to fetch data from Google Sheets', details: error.message });
    }
});

// Route to add data to Google Sheets
app.post('/api/data', async (req, res) => {
    try {
        console.log('Attempting to add data to Google Sheets...');
        console.log('Request body:', req.body);
        
        const { name, gst_no, address } = req.body;
        const s_no = await getNextSNo();
        
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
            range: 'party_master!A:D',
            valueInputOption: 'RAW',
            requestBody: {
                values: [[s_no, name, gst_no, address]]
            }
        });

        console.log('Successfully added data:', response.data);
        res.json({ success: true, data: response.data });
    } catch (error) {
        console.error('Error adding data:', error);
        console.error('Error details:', error.response ? error.response.data : error);
        res.status(500).json({ error: 'Failed to add data to Google Sheets', details: error.message });
    }
});

// Function to get the next S.No for products
async function getNextProductSNo() {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
            range: 'prod_master!A:A',
        });

        const values = response.data.values || [];
        // Skip header row, count existing rows
        const nextSNo = values.length;
        return nextSNo;
    } catch (error) {
        console.error('Error getting next product S.No:', error);
        throw error;
    }
}

// Route to get product data from Google Sheets
app.get('/api/product-data', async (req, res) => {
    try {
        console.log('Attempting to fetch product data from Google Sheets...');
        console.log('Spreadsheet ID:', process.env.GOOGLE_SHEETS_SPREADSHEET_ID);
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
            range: 'prod_master!A:D',
        });

        console.log('Successfully fetched product data:', response.data);
        // Skip the header row
        const data = response.data.values ? response.data.values.slice(1) : [];
        res.json(data);
    } catch (error) {
        console.error('Error fetching product data:', error);
        console.error('Error details:', error.response ? error.response.data : error);
        res.status(500).json({ error: 'Failed to fetch product data from Google Sheets', details: error.message });
    }
});

// Route to add product data to Google Sheets
app.post('/api/product-data', async (req, res) => {
    try {
        console.log('Attempting to add product data to Google Sheets...');
        console.log('Request body:', req.body);
        
        const { name, hsn_code, type } = req.body;
        const s_no = await getNextProductSNo();
        
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
            range: 'prod_master!A:D',
            valueInputOption: 'RAW',
            requestBody: {
                values: [[s_no, name, hsn_code, type]]
            }
        });

        console.log('Successfully added product data:', response.data);
        res.json({ success: true, data: response.data });
    } catch (error) {
        console.error('Error adding product data:', error);
        console.error('Error details:', error.response ? error.response.data : error);
        res.status(500).json({ error: 'Failed to add product data to Google Sheets', details: error.message });
    }
});

// Function to get the next S.No for incoming bills
async function getNextBillSNo() {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
            range: 'incoming_bills!A:A',
        });

        const values = response.data.values || [];
        // Skip header row, count existing rows
        const nextSNo = values.length;
        return nextSNo;
    } catch (error) {
        console.error('Error getting next bill S.No:', error);
        throw error;
    }
}

// Function to get the next item_id for bill items
async function getNextItemId() {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
            range: 'bill_items!A:A',
        });

        const values = response.data.values || [];
        // Skip header row, count existing rows
        const nextItemId = values.length;
        return nextItemId;
    } catch (error) {
        console.error('Error getting next item ID:', error);
        throw error;
    }
}

// Route to add incoming bill and its items
app.post('/api/incoming-bills', async (req, res) => {
    try {
        console.log('Attempting to add incoming bill...');
        console.log('Request body:', req.body);
        
        const { inv_id, party_id, account_id, bill_date, tds_percent, discount_percent, remarks, items } = req.body;
        
        // Get next S.No for the bill
        const s_no = await getNextBillSNo();
        
        // Calculate final amount
        const subTotal = items.reduce((sum, item) => sum + item.total_amount, 0);
        const discountAmount = (subTotal * discount_percent) / 100;
        const tdsAmount = (subTotal * tds_percent) / 100;
        const finalAmount = subTotal - discountAmount - tdsAmount;

        // Add bill to incoming_bills sheet
        const billResponse = await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
            range: 'incoming_bills!A:K',
            valueInputOption: 'RAW',
            requestBody: {
                values: [[
                    s_no,
                    inv_id,
                    party_id,
                    account_id,
                    bill_date,
                    finalAmount,
                    tds_percent,
                    tdsAmount,
                    discount_percent,
                    discountAmount,
                    remarks
                ]]
            }
        });

        // Add items to bill_items sheet
        for (const item of items) {
            const item_id = await getNextItemId();
            
            await sheets.spreadsheets.values.append({
                spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
                range: 'bill_items!A:I',
                valueInputOption: 'RAW',
                requestBody: {
                    values: [[
                        item_id,
                        s_no, // bill_s_no as foreign key
                        item.product_id,
                        item.qty,
                        item.rate,
                        item.sub_total,
                        item.gst_percent,
                        item.sgst_amount,
                        item.cgst_amount,
                        item.total_amount
                    ]]
                }
            });
        }

        console.log('Successfully added bill and items');
        res.json({ success: true, bill_s_no: s_no });
    } catch (error) {
        console.error('Error adding bill:', error);
        console.error('Error details:', error.response ? error.response.data : error);
        res.status(500).json({ error: 'Failed to add bill', details: error.message });
    }
});

// Route to get all incoming bills
app.get('/api/incoming-bills', async (req, res) => {
    try {
        console.log('Attempting to fetch all incoming bills...');
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
            range: 'incoming_bills!A:K',
        });

        console.log('Successfully fetched bills:', response.data);
        // Skip the header row
        const data = response.data.values ? response.data.values.slice(1) : [];
        res.json(data);
    } catch (error) {
        console.error('Error fetching bills:', error);
        console.error('Error details:', error.response ? error.response.data : error);
        res.status(500).json({ error: 'Failed to fetch bills', details: error.message });
    }
});

// Route to get a specific bill and its items
app.get('/api/incoming-bills/:s_no', async (req, res) => {
    try {
        const s_no = req.params.s_no;
        console.log(`Attempting to fetch bill ${s_no} and its items...`);

        // Get bill details
        const billResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
            range: 'incoming_bills!A:K',
        });

        const bills = billResponse.data.values ? billResponse.data.values.slice(1) : [];
        const bill = bills.find(b => b[0] === s_no);

        if (!bill) {
            return res.status(404).json({ error: 'Bill not found' });
        }

        // Get bill items
        const itemsResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
            range: 'bill_items!A:J',
        });

        const allItems = itemsResponse.data.values ? itemsResponse.data.values.slice(1) : [];
        const items = allItems.filter(item => item[1] === s_no);

        // Format the response
        const billData = {
            s_no: bill[0],
            inv_id: bill[1],
            party_id: bill[2],
            account_id: bill[3],
            bill_date: bill[4],
            final_amount: bill[5],
            tds_percent: bill[6],
            tds_amount: bill[7],
            discount_percent: bill[8],
            discount_amount: bill[9],
            remarks: bill[10],
            items: items.map(item => ({
                item_id: item[0],
                bill_s_no: item[1],
                product_id: item[2],
                qty: item[3],
                rate: item[4],
                sub_total: item[5],
                gst_percent: item[6],
                sgst_amount: item[7],
                cgst_amount: item[8],
                total_amount: item[9]
            }))
        };

        res.json(billData);
    } catch (error) {
        console.error('Error fetching bill details:', error);
        console.error('Error details:', error.response ? error.response.data : error);
        res.status(500).json({ error: 'Failed to fetch bill details', details: error.message });
    }
});

// Route to update a specific bill and its items
app.put('/api/incoming-bills/:s_no', async (req, res) => {
    try {
        const s_no = req.params.s_no;
        console.log(`Attempting to update bill ${s_no}...`);
        console.log('Request body:', req.body);

        const { inv_id, party_id, bill_date, tds_percent, discount_percent, remarks, items } = req.body;

        // Calculate final amount
        const subTotal = items.reduce((sum, item) => sum + item.total_amount, 0);
        const discountAmount = (subTotal * discount_percent) / 100;
        const tdsAmount = (subTotal * tds_percent) / 100;
        const finalAmount = subTotal - discountAmount - tdsAmount;

        // Get current bill data
        const billResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
            range: 'incoming_bills!A:K',
        });

        const bills = billResponse.data.values || [];
        const billIndex = bills.findIndex(b => b[0] === s_no);

        if (billIndex === -1) {
            return res.status(404).json({ error: 'Bill not found' });
        }

        // Update bill row
        const updatedBill = [
            s_no,
            inv_id,
            party_id,
            bills[billIndex][3], // Keep original account_id
            bill_date,
            finalAmount,
            tds_percent,
            tdsAmount,
            discount_percent,
            discountAmount,
            remarks
        ];

        // Update bill in sheet
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
            range: `incoming_bills!A${billIndex + 1}:K${billIndex + 1}`,
            valueInputOption: 'RAW',
            requestBody: {
                values: [updatedBill]
            }
        });

        // Get current items
        const itemsResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
            range: 'bill_items!A:J',
        });

        const allItems = itemsResponse.data.values || [];
        const existingItems = allItems.filter(item => item[1] === s_no);

        // Update existing items or add new ones
        for (let i = 0; i < Math.max(existingItems.length, items.length); i++) {
            if (i < existingItems.length && i < items.length) {
                // Update existing item
                const item = items[i];
                const rowIndex = allItems.findIndex(row => row[0] === existingItems[i][0]);
                
                await sheets.spreadsheets.values.update({
                    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
                    range: `bill_items!A${rowIndex + 1}:J${rowIndex + 1}`,
                    valueInputOption: 'RAW',
                    requestBody: {
                        values: [[
                            existingItems[i][0], // Keep original item_id
                            s_no,
                            item.product_id,
                            item.qty,
                            item.rate,
                            item.sub_total,
                            item.gst_percent,
                            item.sgst_amount,
                            item.cgst_amount,
                            item.total_amount
                        ]]
                    }
                });
            } else if (i < existingItems.length) {
                // Delete extra existing items
                const rowIndex = allItems.findIndex(row => row[0] === existingItems[i][0]);
                await sheets.spreadsheets.values.update({
                    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
                    range: `bill_items!A${rowIndex + 1}:J${rowIndex + 1}`,
                    valueInputOption: 'RAW',
                    requestBody: {
                        values: [Array(10).fill('')] // Clear the row
                    }
                });
            } else if (i < items.length) {
                // Add new items
                const item = items[i];
                const item_id = await getNextItemId();
                
                await sheets.spreadsheets.values.append({
                    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
                    range: 'bill_items!A:J',
                    valueInputOption: 'RAW',
                    requestBody: {
                        values: [[
                            item_id,
                            s_no,
                            item.product_id,
                            item.qty,
                            item.rate,
                            item.sub_total,
                            item.gst_percent,
                            item.sgst_amount,
                            item.cgst_amount,
                            item.total_amount
                        ]]
                    }
                });
            }
        }

        console.log('Successfully updated bill and items');
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating bill:', error);
        console.error('Error details:', error.response ? error.response.data : error);
        res.status(500).json({ error: 'Failed to update bill', details: error.message });
    }
});

// Route to delete a specific bill and its items
app.delete('/api/incoming-bills/:s_no', async (req, res) => {
    try {
        const s_no = req.params.s_no;
        console.log(`Attempting to delete bill ${s_no}...`);

        // First, get the spreadsheet metadata to get sheet IDs
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID
        });

        // Find sheet IDs
        const incomingBillsSheet = spreadsheet.data.sheets.find(sheet => sheet.properties.title === 'incoming_bills');
        const billItemsSheet = spreadsheet.data.sheets.find(sheet => sheet.properties.title === 'bill_items');

        if (!incomingBillsSheet || !billItemsSheet) {
            throw new Error('Required sheets not found');
        }

        // Get bill items
        const itemsResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
            range: 'bill_items!A:J',
        });

        const allItems = itemsResponse.data.values || [];
        const itemRowsToDelete = allItems
            .map((row, index) => row[1] === s_no ? index + 1 : null)
            .filter(index => index !== null)
            .reverse(); // Delete from bottom to top to maintain row numbers

        // Delete items
        for (const rowIndex of itemRowsToDelete) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
                requestBody: {
                    requests: [{
                        deleteDimension: {
                            range: {
                                sheetId: billItemsSheet.properties.sheetId,
                                dimension: 'ROWS',
                                startIndex: rowIndex - 1,
                                endIndex: rowIndex
                            }
                        }
                    }]
                }
            });
        }

        // Get bill row
        const billResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
            range: 'incoming_bills!A:K',
        });

        const bills = billResponse.data.values || [];
        const billIndex = bills.findIndex(b => b[0] === s_no);

        if (billIndex === -1) {
            return res.status(404).json({ error: 'Bill not found' });
        }

        // Delete bill row
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
            requestBody: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: incomingBillsSheet.properties.sheetId,
                            dimension: 'ROWS',
                            startIndex: billIndex,
                            endIndex: billIndex + 1
                        }
                    }
                }]
            }
        });

        console.log('Successfully deleted bill and items');
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting bill:', error);
        console.error('Error details:', error.response ? error.response.data : error);
        res.status(500).json({ error: 'Failed to delete bill', details: error.message });
    }
});

// Function to get the next A_ID for accounts
async function getNextAccountId() {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
            range: 'accts!A:A',
        });

        const values = response.data.values || [];
        // Skip header row, count existing rows
        const nextAId = values.length;
        return nextAId;
    } catch (error) {
        console.error('Error getting next A_ID:', error);
        throw error;
    }
}

// Route to get all accounts
app.get('/api/accounts', async (req, res) => {
    try {
        console.log('Attempting to fetch accounts...');
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
            range: 'accts!A:C',
        });

        console.log('Successfully fetched accounts:', response.data);
        // Skip the header row
        const data = response.data.values ? response.data.values.slice(1) : [];
        res.json(data);
    } catch (error) {
        console.error('Error fetching accounts:', error);
        console.error('Error details:', error.response ? error.response.data : error);
        res.status(500).json({ error: 'Failed to fetch accounts', details: error.message });
    }
});

// Route to add a new account
app.post('/api/accounts', async (req, res) => {
    try {
        console.log('Attempting to add account...');
        console.log('Request body:', req.body);
        
        const { name, type } = req.body;
        const a_id = await getNextAccountId();
        
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
            range: 'accts!A:C',
            valueInputOption: 'RAW',
            requestBody: {
                values: [[a_id, name, type]]
            }
        });

        console.log('Successfully added account:', response.data);
        res.json({ success: true, data: response.data });
    } catch (error) {
        console.error('Error adding account:', error);
        console.error('Error details:', error.response ? error.response.data : error);
        res.status(500).json({ error: 'Failed to add account', details: error.message });
    }
});

// Route to update an account
app.put('/api/accounts/:a_id', async (req, res) => {
    try {
        const a_id = req.params.a_id;
        console.log(`Attempting to update account ${a_id}...`);
        console.log('Request body:', req.body);
        
        const { name, type } = req.body;

        // Get current accounts data
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
            range: 'accts!A:C',
        });

        const accounts = response.data.values || [];
        const accountIndex = accounts.findIndex(a => a[0] === a_id);

        if (accountIndex === -1) {
            return res.status(404).json({ error: 'Account not found' });
        }

        // Update account
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
            range: `accts!A${accountIndex + 1}:C${accountIndex + 1}`,
            valueInputOption: 'RAW',
            requestBody: {
                values: [[a_id, name, type]]
            }
        });

        console.log('Successfully updated account');
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating account:', error);
        console.error('Error details:', error.response ? error.response.data : error);
        res.status(500).json({ error: 'Failed to update account', details: error.message });
    }
});

// Add route to serve accounts.html
app.get('/accounts', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'accounts.html'));
});

// Route to get account types
app.get('/api/account-types', async (req, res) => {
    try {
        console.log('Attempting to fetch account types...');
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
            range: 'accts!A:C',
        });

        console.log('Successfully fetched account types:', response.data);
        // Skip the header row and map to { a_id, name, type }
        const data = response.data.values ? response.data.values.slice(1).map(row => ({
            a_id: row[0],
            name: row[1],
            type: row[2]
        })) : [];
        res.json(data);
    } catch (error) {
        console.error('Error fetching account types:', error);
        console.error('Error details:', error.response ? error.response.data : error);
        res.status(500).json({ error: 'Failed to fetch account types', details: error.message });
    }
});

// API endpoint to add outgoing bill
app.post('/api/outgoing-bills', async (req, res) => {
    try {
        console.log('Adding new outgoing bill:', req.body);

        // Get metadata to find sheet IDs
        const metadata = await sheets.spreadsheets.get({
            spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID
        });

        const outgoingBillsSheet = metadata.data.sheets.find(sheet => sheet.properties.title === 'outgoing_bills');
        const outgoingBillItemsSheet = metadata.data.sheets.find(sheet => sheet.properties.title === 'outgoing_bills_items');

        if (!outgoingBillsSheet || !outgoingBillItemsSheet) {
            throw new Error('Required sheets not found');
        }

        // Get next bill number for s_no
        const billsResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
            range: 'outgoing_bills!A:A',
        });
        const nextBillNo = (billsResponse.data.values?.length || 0);

        // Add bill to outgoing_bills sheet
        const billResponse = await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
            range: 'outgoing_bills',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[
                    nextBillNo,  // s_no
                    req.body.bill_no,
                    req.body.party_id,
                    req.body.bill_date,
                    req.body.account_id,
                    req.body.tds_percent,
                    req.body.tds_amount,
                    req.body.final_amount
                ]]
            }
        });

        // Get next item_id
        const itemsResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
            range: 'outgoing_bills_items!A:A',
        });
        let nextItemId = (itemsResponse.data.values?.length || 0);

        // Add bill items with the correct fields
        const itemValues = req.body.items.map(item => {
            nextItemId++;
            return [
                nextItemId,  // item_id
                nextBillNo,  // bill_s_no
                item.product_id,
                item.qty,
                item.rate,
                item.sub_total,
                item.gst_percent,
                item.sgst_amount,
                item.cgst_amount,
                item.total_amount
            ];
        });

        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
            range: 'outgoing_bills_items',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: itemValues
            }
        });

        res.json({ success: true, message: 'Outgoing bill added successfully' });
    } catch (error) {
        console.error('Error adding outgoing bill:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error adding outgoing bill',
            details: error.message 
        });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});