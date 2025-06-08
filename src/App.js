import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, doc, onSnapshot, deleteDoc, updateDoc, query, orderBy, where, getDocs, writeBatch, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- Helper Functions & Configuration ---

// IMPORTANT: Paste your Firebase configuration here
const firebaseConfig = {
  apiKey: "AIzaSyDhDgec7ErD3svDh9rLgxxUlsm7EriTWZA",
  authDomain: "amigos---business-manager-app.firebaseapp.com",
  projectId: "amigos---business-manager-app",
  storageBucket: "amigos---business-manager-app.firebasestorage.app",
  messagingSenderId: "653963199027",
  appId: "1:653963199027:web:277fc74e6209c51b7e5946",
  measurementId: "G-6FXWH043LB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- SVG Icons ---

const Icon = ({ path, className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
);

const ICONS = {
    dashboard: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
    transactions: "M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5",
    invoices: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    settings: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.438.995s.145.755.438.995l1.003.827c.485.4.664 1.076.26 1.431l-1.296 2.247a1.125 1.125 0 01-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.52 6.52 0 01-.22-.127c-.324-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 01-1.37-.49l-1.296-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.437-.995s-.145-.755-.437-.995l-1.004-.827a1.125 1.125 0 01-.26-1.431l1.296-2.247a1.125 1.125 0 011.37-.49l1.217.456c.355.133.75.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281zM12 15a3 3 0 100-6 3 3 0 000 6z",
    logout: "M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75",
    plus: "M12 4.5v15m7.5-7.5h-15",
    edit: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10",
    delete: "M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0",
    download: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3",
    upload: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v12",
    close: "M6 18L18 6M6 6l12 12",
    back: "M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
};

// --- Reusable UI Components ---

const Card = ({ children, className = "" }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 ${className}`}>
        {children}
    </div>
);

const Button = ({ onClick, children, className = "", variant = 'primary', ...props }) => {
    const baseClasses = "px-4 py-2 rounded-lg font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
    const variants = {
        primary: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500',
        danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    };
    return (
        <button onClick={onClick} className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
                 <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                        <Icon path={ICONS.close} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

const Input = React.forwardRef(({ label, id, ...props }, ref) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <input id={id} {...props} ref={ref} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white" />
    </div>
));

const Select = React.forwardRef(({ label, id, children, ...props }, ref) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <select id={id} {...props} ref={ref} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white">
            {children}
        </select>
    </div>
));


// --- Core Feature Components ---

const Dashboard = ({ transactions, invoices, setView }) => {
    const stats = useMemo(() => {
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const income = transactions.filter(t => t.type === 'income' && new Date(t.date) >= thisMonthStart).reduce((sum, t) => sum + t.amount, 0);
        const expenses = transactions.filter(t => t.type === 'expense' && new Date(t.date) >= thisMonthStart).reduce((sum, t) => sum + t.amount, 0);
        const totalBalance = transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
        const pendingInvoices = invoices.filter(i => i.status === 'pending');
        
        return { income, expenses, totalBalance, pendingInvoices };
    }, [transactions, invoices]);

    const expenseByCategory = useMemo(() => {
        const categoryMap = {};
        transactions.filter(t => t.type === 'expense').forEach(t => {
            const category = t.category || 'Uncategorized';
            categoryMap[category] = (categoryMap[category] || 0) + t.amount;
        });
        return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
    }, [transactions]);
    
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560'];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="lg:col-span-1 bg-gradient-to-br from-green-400 to-green-600 text-white">
                <h4 className="font-bold text-lg">Total Balance</h4>
                <p className="text-3xl font-bold mt-2">₹{stats.totalBalance.toLocaleString('en-IN')}</p>
            </Card>
            <Card className="lg:col-span-1 bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                <h4 className="font-bold text-lg">Income (This Month)</h4>
                <p className="text-3xl font-bold mt-2">₹{stats.income.toLocaleString('en-IN')}</p>
            </Card>
            <Card className="lg:col-span-1 bg-gradient-to-br from-red-400 to-red-600 text-white">
                <h4 className="font-bold text-lg">Expenses (This Month)</h4>
                <p className="text-3xl font-bold mt-2">₹{stats.expenses.toLocaleString('en-IN')}</p>
            </Card>
            <Card className="lg:col-span-1 bg-gradient-to-br from-yellow-400 to-yellow-600 text-white cursor-pointer" onClick={() => setView('invoices')}>
                 <h4 className="font-bold text-lg">Pending Invoices</h4>
                <p className="text-3xl font-bold mt-2">{stats.pendingInvoices.length}</p>
            </Card>

            <Card className="md:col-span-2 lg:col-span-2">
                <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">Expense Breakdown</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                            {expenseByCategory.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </Card>

            <Card className="md:col-span-2 lg:col-span-2">
                 <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">Recent Transactions</h3>
                 <div className="space-y-3 max-h-72 overflow-y-auto">
                    {transactions.slice(0, 5).map(t => (
                        <div key={t.id} className="flex justify-between items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                           <div>
                               <p className="font-semibold text-gray-800 dark:text-white">{t.description}</p>
                               <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(t.date).toLocaleDateString()} by {t.user}</p>
                           </div>
                            <p className={`font-bold ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                            </p>
                        </div>
                    ))}
                 </div>
            </Card>
        </div>
    );
};

const TransactionForm = ({ onSave, onCancel, transaction }) => {
    const [type, setType] = useState(transaction?.type || 'expense');
    const [amount, setAmount] = useState(transaction?.amount || '');
    const [category, setCategory] = useState(transaction?.category || 'food');
    const [date, setDate] = useState(transaction?.date || new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState(transaction?.description || '');
    const [tags, setTags] = useState(transaction?.tags?.join(', ') || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            type,
            amount: parseFloat(amount),
            category,
            date,
            description,
            tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
        });
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Select label="Type" id="type" value={type} onChange={e => setType(e.target.value)}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
            </Select>
            <Input label="Amount" id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} required step="0.01" />
            <Input label="Description" id="description" type="text" value={description} onChange={e => setDescription(e.target.value)} required />
            <Input label="Category" id="category" type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g., Food, Travel, Salary" />
            <Input label="Date" id="date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
            <Input label="Tags (comma-separated)" id="tags" type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g., business, personal" />
            <div className="flex justify-end gap-4 pt-4">
                <Button onClick={onCancel} variant="secondary" type="button">Cancel</Button>
                <Button type="submit">Save</Button>
            </div>
        </form>
    );
};

const Transactions = ({ user, selectedProject, transactions, setTransactions, categories, exportLibsLoaded, userRole }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [filter, setFilter] = useState('all');

    const canWrite = userRole === 'owner' || userRole === 'read-write' || userRole === 'dashboard-transactions';

    const handleSave = async (data) => {
        if (!user || !selectedProject || !canWrite) return;
        try {
            const path = `projects/${selectedProject.id}/transactions`;
            if (editingTransaction) {
                const docRef = doc(db, path, editingTransaction.id);
                await updateDoc(docRef, data);
            } else {
                await addDoc(collection(db, path), {
                    ...data,
                    user: user.displayName,
                    userEmail: user.email,
                    createdAt: new Date(),
                });
            }
        } catch (error) {
            console.error("Error saving transaction: ", error);
        }
        setIsModalOpen(false);
        setEditingTransaction(null);
    };

    const handleDelete = async (id) => {
        if (!user || !selectedProject || !canWrite || !window.confirm('Are you sure you want to delete this transaction?')) return;
        try {
            const path = `projects/${selectedProject.id}/transactions`;
            await deleteDoc(doc(db, path, id));
        } catch (error) {
            console.error("Error deleting transaction: ", error);
        }
    };
    
    const exportToPDF = () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text(`Transactions for ${selectedProject.name}`, 14, 16);
        doc.autoTable({
            head: [['Date', 'Description', 'Category', 'User', 'Amount']],
            body: transactions.map(t => [
                new Date(t.date).toLocaleDateString(),
                t.description,
                t.category,
                t.user,
                `₹${t.amount.toLocaleString('en-IN')}`
            ]),
        });
        doc.save(`${selectedProject.name}-transactions.pdf`);
    };

    const exportToExcel = () => {
        const { XLSX } = window;
        const worksheet = XLSX.utils.json_to_sheet(transactions.map(t => ({
            Date: new Date(t.date).toLocaleDateString(),
            Description: t.description,
            Category: t.category,
            User: t.user,
            Amount: t.amount,
            Tags: t.tags?.join(', ')
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
        XLSX.writeFile(workbook, `${selectedProject.name}-transactions.xlsx`);
    };

    const filteredTransactions = useMemo(() => {
        if (filter === 'all') return transactions;
        return transactions.filter(t => t.category === filter);
    }, [filter, transactions]);


    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Transactions</h2>
                <div className="flex gap-2 flex-wrap justify-center">
                    <Button onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }} disabled={!canWrite}>
                        <Icon path={ICONS.plus} className="w-5 h-5"/> New Transaction
                    </Button>
                    <Button onClick={exportToPDF} variant="secondary" disabled={!exportLibsLoaded} title={!exportLibsLoaded ? "Export libraries are loading..." : "Export to PDF"}>
                        <Icon path={ICONS.download} className="w-5 h-5"/> PDF
                    </Button>
                    <Button onClick={exportToExcel} variant="secondary" disabled={!exportLibsLoaded} title={!exportLibsLoaded ? "Export libraries are loading..." : "Export to Excel"}>
                        <Icon path={ICONS.download} className="w-5 h-5"/> Excel
                    </Button>
                </div>
            </div>

            <div className="mb-4">
                <Select label="Filter by Category" id="categoryFilter" value={filter} onChange={e => setFilter(e.target.value)}>
                    <option value="all">All Categories</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </Select>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTransaction ? 'Edit Transaction' : 'New Transaction'}>
                <TransactionForm onSave={handleSave} onCancel={() => setIsModalOpen(false)} transaction={editingTransaction} />
            </Modal>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">Date</th>
                            <th scope="col" className="px-6 py-3">Description</th>
                            <th scope="col" className="px-6 py-3">User</th>
                            <th scope="col" className="px-6 py-3">Category</th>
                            <th scope="col" className="px-6 py-3">Amount</th>
                            <th scope="col" className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTransactions.map(t => (
                            <tr key={t.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-6 py-4">{new Date(t.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{t.description}</td>
                                <td className="px-6 py-4">{t.user}</td>
                                <td className="px-6 py-4"><span className="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">{t.category}</span></td>
                                <td className={`px-6 py-4 font-bold ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                     {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                                </td>
                                <td className="px-6 py-4 flex gap-2">
                                    <button onClick={() => { setEditingTransaction(t); setIsModalOpen(true); }} className="text-blue-500 hover:text-blue-700" disabled={!canWrite}><Icon path={ICONS.edit} /></button>
                                    <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-700" disabled={!canWrite}><Icon path={ICONS.delete} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredTransactions.length === 0 && <p className="text-center p-8 text-gray-500 dark:text-gray-400">No transactions found.</p>}
            </div>
        </div>
    );
};

const InvoiceForm = ({ onSave, onCancel, invoice }) => {
    const [clientName, setClientName] = useState(invoice?.clientName || '');
    const [amount, setAmount] = useState(invoice?.amount || '');
    const [dueDate, setDueDate] = useState(invoice?.dueDate || new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState(invoice?.status || 'pending');
    const [pdfFile, setPdfFile] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            clientName,
            amount: parseFloat(amount),
            dueDate,
            status
        }, pdfFile);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Client Name" id="clientName" type="text" value={clientName} onChange={e => setClientName(e.target.value)} required />
            <Input label="Amount" id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} required step="0.01" />
            <Input label="Due Date" id="dueDate" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
            <Select label="Status" id="status" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
            </Select>
            <Input label="Upload Bill (PDF)" id="pdfFile" type="file" accept="application/pdf" onChange={e => setPdfFile(e.target.files[0])} />
            <div className="flex justify-end gap-4 pt-4">
                <Button onClick={onCancel} variant="secondary" type="button">Cancel</Button>
                <Button type="submit">Save Invoice</Button>
            </div>
        </form>
    );
};

const Invoices = ({ user, selectedProject, invoices, setInvoices, exportLibsLoaded, userRole }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState(null);

    const canWrite = userRole === 'owner' || userRole === 'read-write';
    
    const handleSave = async (data, pdfFile) => {
        if (!user || !selectedProject || !canWrite) return;
        try {
            let fileURL = editingInvoice?.fileURL || '';
            let filePath = editingInvoice?.filePath || '';

            if (pdfFile) {
                const storageRef = ref(storage, `projects/${selectedProject.id}/invoices/${Date.now()}_${pdfFile.name}`);
                const snapshot = await uploadBytes(storageRef, pdfFile);
                fileURL = await getDownloadURL(snapshot.ref);
                filePath = snapshot.ref.fullPath;
            }
            
            const path = `projects/${selectedProject.id}/invoices`;
            const invoiceData = { ...data, fileURL, filePath, user: user.displayName, userEmail: user.email };
            
            if (editingInvoice) {
                const docRef = doc(db, path, editingInvoice.id);
                await updateDoc(docRef, invoiceData);
            } else {
                await addDoc(collection(db, path), {
                    ...invoiceData,
                    createdAt: new Date(),
                    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`
                });
            }
        } catch (error) {
            console.error("Error saving invoice: ", error);
        }
        setIsModalOpen(false);
        setEditingInvoice(null);
    };

    const handleDelete = async (id) => {
        if (!user || !selectedProject || !canWrite || !window.confirm('Are you sure? This will delete the invoice record.')) return;
        try {
            const path = `projects/${selectedProject.id}/invoices`;
            await deleteDoc(doc(db, path, id));
            // Note: This does not delete the file from storage to prevent accidental data loss.
        } catch (error) {
            console.error("Error deleting invoice: ", error);
        }
    };
    
    const generateInvoicePDF = (invoice) => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.text("Invoice", 105, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.text(`Invoice #: ${invoice.invoiceNumber}`, 20, 40);
        doc.text(`Client: ${invoice.clientName}`, 20, 50);
        const createdAt = invoice.createdAt?.seconds ? new Date(invoice.createdAt.seconds * 1000) : new Date();
        doc.text(`Date: ${createdAt.toLocaleDateString()}`, 140, 40);
        doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 140, 50);

        doc.autoTable({
            startY: 70,
            head: [['Description', 'Amount']],
            body: [['Service/Product', `₹${invoice.amount.toLocaleString('en-IN')}`]],
            foot: [['Total', `₹${invoice.amount.toLocaleString('en-IN')}`]]
        });

        doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
    };

    const statusBadge = (status) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
        };
        return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>{status}</span>
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Invoices</h2>
                <Button onClick={() => { setEditingInvoice(null); setIsModalOpen(true); }} disabled={!canWrite}>
                    <Icon path={ICONS.plus} className="w-5 h-5"/> New Invoice
                </Button>
            </div>
            
             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingInvoice ? 'Edit Invoice' : 'New Invoice'}>
                <InvoiceForm onSave={handleSave} onCancel={() => setIsModalOpen(false)} invoice={editingInvoice} />
            </Modal>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {invoices.map(inv => (
                    <Card key={inv.id}>
                       <div className="flex justify-between items-start">
                           <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{inv.invoiceNumber}</p>
                            <h4 className="font-bold text-lg text-gray-800 dark:text-white">{inv.clientName}</h4>
                           </div>
                           {statusBadge(inv.status)}
                       </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white my-4">₹{inv.amount.toLocaleString('en-IN')}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Due: {new Date(inv.dueDate).toLocaleDateString()}</p>
                        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                             <button onClick={() => generateInvoicePDF(inv)} disabled={!exportLibsLoaded} className="text-gray-500 hover:text-gray-700 dark:hover:text-white flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                <Icon path={ICONS.download} className="w-5 h-5" /> PDF
                            </button>
                            {inv.fileURL && (
                                <a href={inv.fileURL} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-700 dark:hover:text-white flex-1 flex items-center justify-center gap-2">
                                    <Icon path={ICONS.upload} className="w-5 h-5" /> View Bill
                                </a>
                            )}
                            <button onClick={() => { setEditingInvoice(inv); setIsModalOpen(true); }} className="text-blue-500 hover:text-blue-700" disabled={!canWrite}><Icon path={ICONS.edit} /></button>
                            <button onClick={() => handleDelete(inv.id)} className="text-red-500 hover:text-red-700" disabled={!canWrite}><Icon path={ICONS.delete} /></button>
                        </div>
                    </Card>
                ))}
                 {invoices.length === 0 && <p className="text-center p-8 text-gray-500 dark:text-gray-400 col-span-full">No invoices found.</p>}
            </div>
        </div>
    );
};

// --- Main App Component ---

const App = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [exportLibsLoaded, setExportLibsLoaded] = useState(false);
    
    // Project state
    const [projects, setProjects] = useState([]);
    const [sharedProjects, setSharedProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [modal, setModal] = useState({ isOpen: false, type: '', data: null });
    const [userRole, setUserRole] = useState(null);

    // Data states
    const [transactions, setTransactions] = useState([]);
    const [invoices, setInvoices] = useState([]);
    
    const allProjects = useMemo(() => [...projects, ...sharedProjects], [projects, sharedProjects]);

    const categories = useMemo(() => {
        const catSet = new Set(transactions.map(t => t.category));
        return Array.from(catSet);
    }, [transactions]);

    // Check if the external export libraries have loaded
    useEffect(() => {
        const interval = setInterval(() => {
            if (window.jspdf && window.XLSX) {
                setExportLibsLoaded(true);
                clearInterval(interval);
            }
        }, 100);
        return () => clearInterval(interval); // Cleanup on unmount
    }, []);

    // Auth listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                setUser(null);
                setProjects([]);
                setSharedProjects([]);
                setSelectedProject(null);
                setTransactions([]);
                setInvoices([]);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Fetch user's own and shared projects
    useEffect(() => {
        if (!user) return;

        // Fetch owned projects
        const projectsQuery = query(collection(db, 'projects'), where("ownerId", "==", user.uid));
        const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
            const fetchedProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProjects(fetchedProjects);
        });

        // Fetch shared projects
        const sanitizedEmail = user.email.replace(/\./g, '_');
        const sharedProjectsQuery = query(collection(db, 'projects'), where(`contributors.${sanitizedEmail}`, 'in', ['read', 'read-write', 'dashboard-transactions']));
        const unsubscribeShared = onSnapshot(sharedProjectsQuery, (snapshot) => {
            const fetchedShared = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSharedProjects(fetchedShared);
        });


        return () => {
            unsubscribeProjects();
            unsubscribeShared();
        };
    }, [user]);
    
    // Listen for real-time updates to the selected project (for contributors)
    useEffect(() => {
        if (!selectedProject?.id) return;

        const projectRef = doc(db, `projects/${selectedProject.id}`);
        const unsubscribe = onSnapshot(projectRef, (doc) => {
            if (doc.exists()) {
                 setSelectedProject(prev => ({...prev, ...doc.data()}));
            }
        });

        return () => unsubscribe();
    }, [selectedProject?.id]);


    // Fetch data for the selected project and determine user role
    useEffect(() => {
        if (!user || !selectedProject) {
            setTransactions([]);
            setInvoices([]);
            setUserRole(null);
            return;
        };

        // Determine user role for the selected project
        if (selectedProject.ownerId === user.uid) {
            setUserRole('owner');
        } else {
            const sanitizedEmail = user.email.replace(/\./g, '_');
            const role = selectedProject.contributors[sanitizedEmail];
            setUserRole(role || null);
        }

        const projectPath = `projects/${selectedProject.id}`;

        const transactionQuery = query(collection(db, projectPath, 'transactions'), orderBy('date', 'desc'));
        const unsubscribeTransactions = onSnapshot(transactionQuery, (snapshot) => {
            const fetchedTransactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTransactions(fetchedTransactions);
        });

        const invoiceQuery = query(collection(db, projectPath, 'invoices'), orderBy('createdAt', 'desc'));
        const unsubscribeInvoices = onSnapshot(invoiceQuery, (snapshot) => {
            const fetchedInvoices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setInvoices(fetchedInvoices);
        });

        return () => {
            unsubscribeTransactions();
            unsubscribeInvoices();
        };
    }, [user, selectedProject]);


    const handleGoogleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Authentication error:", error);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            setView('dashboard');
        } catch (error) {
            console.error("Sign out error:", error);
        }
    };
    
    // --- Project Management Functions ---
    const handleAddProject = async (projectName) => {
        if (!user) return;
        if (projects.length >= 5) {
            setModal({ isOpen: true, type: 'limitReached' });
            return;
        }

        try {
            await addDoc(collection(db, `projects`), {
                name: projectName,
                ownerId: user.uid,
                ownerEmail: user.email,
                createdAt: new Date(),
                contributors: {}
            });
            setModal({ isOpen: false });
        } catch (error) {
            console.error("Error adding project:", error);
        }
    };

    const handleEditProject = async (projectId, newName) => {
        if(!user) return;
        try {
            const docRef = doc(db, `projects/${projectId}`);
            await updateDoc(docRef, { name: newName });
            setModal({ isOpen: false });
        } catch (error) {
            console.error("Error updating project:", error);
        }
    }
    
    const handleDeleteProject = async (projectToDelete) => {
        if(!user || projectToDelete.ownerId !== user.uid) {
            alert("You can only delete projects you own.");
            return;
        };
        if (!window.confirm(`Are you sure you want to permanently delete the project "${projectToDelete.name}" and all its data? This cannot be undone.`)) return;

        try {
            const projectRef = doc(db, `projects/${projectToDelete.id}`);
            const batch = writeBatch(db);

            // Delete subcollections
            const transactionsRef = collection(projectRef, 'transactions');
            const invoicesRef = collection(projectRef, 'invoices');
            const transSnap = await getDocs(transactionsRef);
            const invSnap = await getDocs(invoicesRef);
            transSnap.forEach(doc => batch.delete(doc.ref));
            invSnap.forEach(doc => batch.delete(doc.ref));

            // Delete the project document itself
            batch.delete(projectRef);

            await batch.commit();

            setSelectedProject(null);
            setModal({ isOpen: false });

        } catch (error) {
            console.error("Error deleting project:", error);
        }
    }

    const handleAddContributor = async (project, email, role) => {
        if (!user || project.ownerId !== user.uid) return;
        const sanitizedEmail = email.replace(/\./g, '_');
        const projectRef = doc(db, `projects/${project.id}`);
        try {
            await updateDoc(projectRef, {
                [`contributors.${sanitizedEmail}`]: role
            });
        } catch (error) {
            console.error("Error adding contributor:", error);
        }
    }

    const handleUpdateContributorRole = async (project, email, role) => {
        if (!user || project.ownerId !== user.uid) return;
        const sanitizedEmail = email.replace(/\./g, '_');
        const projectRef = doc(db, `projects/${project.id}`);
        try {
            await updateDoc(projectRef, {
                [`contributors.${sanitizedEmail}`]: role
            });
        } catch (error) {
            console.error("Error updating contributor role:", error);
        }
    }

    const handleRemoveContributor = async (project, email) => {
        if (!user || project.ownerId !== user.uid) {
            alert("Only the project owner can remove contributors.");
            return;
        }
        if (!window.confirm(`Are you sure you want to remove ${email} as a contributor?`)) {
            return;
        }
        const sanitizedEmail = email.replace(/\./g, '_');
        const projectRef = doc(db, `projects/${project.id}`);
        try {
            const projectSnap = await getDoc(projectRef);
            if (projectSnap.exists()) {
                const updatedContributors = { ...projectSnap.data().contributors };
                delete updatedContributors[sanitizedEmail];
                await updateDoc(projectRef, {
                    contributors: updatedContributors
                });
            }
        } catch(e) {
            console.error("Error removing contributor", e);
            alert("Failed to remove contributor.");
        }
    }


    const renderView = () => {
        switch (view) {
            case 'dashboard':
                return <Dashboard transactions={transactions} invoices={invoices} setView={setView}/>;
            case 'transactions':
                return <Transactions user={user} selectedProject={selectedProject} transactions={transactions} setTransactions={setTransactions} categories={categories} exportLibsLoaded={exportLibsLoaded} userRole={userRole}/>;
            case 'invoices':
                return <Invoices user={user} selectedProject={selectedProject} invoices={invoices} setInvoices={setInvoices} exportLibsLoaded={exportLibsLoaded} userRole={userRole} />;
            case 'settings':
                return <ProjectSettings project={selectedProject} onEditProject={handleEditProject} onDeleteProject={handleDeleteProject} onAddContributor={handleAddContributor} onRemoveContributor={handleRemoveContributor} onUpdateContributorRole={handleUpdateContributorRole} userRole={userRole} />;
            default:
                return <Dashboard transactions={transactions} invoices={invoices} setView={setView}/>;
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><div className="text-xl font-semibold">Loading...</div></div>;
    }

    if (!user) {
        return <LoginScreen onSignIn={handleGoogleSignIn} />;
    }
    
    if (!selectedProject) {
        return (
            <div>
                <ProjectModal modal={modal} setModal={setModal} onAddProject={handleAddProject} />
                <LimitReachedModal modal={modal} setModal={setModal} projects={projects} onDeleteProject={handleDeleteProject} />
                <ProjectSelector 
                    user={user}
                    projects={allProjects} 
                    onSelectProject={setSelectedProject} 
                    onAddProject={() => setModal({isOpen: true, type: 'addProject'})}
                    onSignOut={handleSignOut}
                />
            </div>
        );
    }

    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
            {/* Modals */}
            <ProjectModal modal={modal} setModal={setModal} onAddProject={handleAddProject} />
            <LimitReachedModal modal={modal} setModal={setModal} projects={projects} onDeleteProject={handleDeleteProject} />
            
            <nav className="fixed top-0 z-40 w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 md:hidden">
                 <div className="px-3 py-3 lg:px-5 lg:pl-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center justify-start">
                             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600">
                                <span className="sr-only">Open sidebar</span>
                                <svg className="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path clipRule="evenodd" fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"></path></svg>
                            </button>
                            <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap dark:text-white truncate">{selectedProject.name}</span>
                        </div>
                         <div className="flex items-center">
                            <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />
                        </div>
                    </div>
                 </div>
            </nav>
            
            <aside className={`fixed top-0 left-0 z-30 w-64 h-screen transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                <div className="h-full px-3 py-4 overflow-y-auto bg-white dark:bg-gray-800 flex flex-col">
                    <div className='pl-2.5 mb-5'>
                        <h1 className="self-center text-2xl font-extrabold whitespace-nowrap dark:text-white">Amigos</h1>
                        <p className="text-sm text-blue-400 truncate">{selectedProject.name}</p>
                    </div>

                    <ul className="space-y-2 flex-grow">
                        <NavLink label="Dashboard" viewName="dashboard" currentView={view} setView={setView} setIsSidebarOpen={setIsSidebarOpen} />
                        <NavLink label="Transactions" viewName="transactions" currentView={view} setView={setView} setIsSidebarOpen={setIsSidebarOpen} />
                        <NavLink label="Invoices" viewName="invoices" currentView={view} setView={setView} setIsSidebarOpen={setIsSidebarOpen} />
                        {userRole === 'owner' && <NavLink label="Project Settings" viewName="settings" currentView={view} setView={setView} setIsSidebarOpen={setIsSidebarOpen} />}
                    </ul>
                    <div className="mt-auto">
                         <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4">
                            <button onClick={() => setSelectedProject(null)} className="w-full text-left flex items-center gap-2 hover:text-blue-500">
                                <Icon path={ICONS.back} className="w-5 h-5" />
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">Switch Project</span>
                            </button>
                            <hr className='my-3 border-gray-300 dark:border-gray-600'/>
                            <div className="flex items-center">
                                <img src={user.photoURL} alt="user" className="w-10 h-10 rounded-full" />
                                <div className="ml-3">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.displayName}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                                </div>
                            </div>
                        </div>
                        <Button onClick={handleSignOut} className="w-full" variant="secondary">
                            <Icon path={ICONS.logout} /> Sign Out
                        </Button>
                    </div>
                </div>
            </aside>
            
            {isSidebarOpen && <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}

            <main className="p-4 md:ml-64 mt-16 md:mt-0">
                <div className="p-4 rounded-lg">
                    {renderView()}
                </div>
            </main>
        </div>
    );
};


// --- Standalone Screens and Components ---

const LoginScreen = ({ onSignIn }) => (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col justify-center items-center text-center p-4">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white">Amigos</h1>
        <p className="text-xl md:text-2xl font-light text-blue-600 dark:text-blue-400 mb-8">Business Manager</p>
        <p className="max-w-xl mb-8 text-gray-600 dark:text-gray-300">Your all-in-one solution for managing personal and business finances. Track income, expenses, invoices, and more, all in real-time.</p>
        <Button onClick={onSignIn}>
            <svg className="w-5 h-5 mr-2" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.2 64.5c-24.3-23.6-58.3-38.6-96.7-38.6-73.2 0-132.3 59.2-132.3 132.3s59.1 132.3 132.3 132.3c76.9 0 111.2-51.8 115.8-77.9H248v-62h236.4c.8 12.2 1.2 24.5 1.2 37.4z"></path></svg>
            Sign in with Google
        </Button>
    </div>
);

const ProjectSelector = ({ user, projects, onSelectProject, onAddProject, onSignOut }) => (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-2xl">
            <Card>
                 <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Select a Project</h2>
                        <p className="text-gray-500 dark:text-gray-400">Choose a project or create a new one.</p>
                    </div>
                    <div className="flex items-center gap-3">
                         <img src={user.photoURL} alt={user.displayName} className="w-10 h-10 rounded-full" />
                         <Button onClick={onSignOut} variant="secondary">Sign Out</Button>
                    </div>
                </div>

                <div className="space-y-4 mb-8">
                    {projects.map(p => (
                        <button key={p.id} onClick={() => onSelectProject(p)} className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{p.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {p.ownerEmail === user.email ? "Owner" : `Shared by ${p.ownerEmail}`}
                            </p>
                        </button>
                    ))}
                </div>
                 {projects.length === 0 && (
                    <p className='text-center text-gray-500 dark:text-gray-400 py-8'>You have no projects yet. Create one to get started!</p>
                )}
                <div className="text-center">
                    <Button onClick={onAddProject}>
                        <Icon path={ICONS.plus} className="w-5 h-5" /> New Project
                    </Button>
                </div>
            </Card>
        </div>
    </div>
);

const ProjectModal = ({ modal, setModal, onAddProject }) => {
    const [projectName, setProjectName] = useState('');

    if (modal.type !== 'addProject') return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onAddProject(projectName);
        setProjectName('');
    }

    return (
        <Modal isOpen={modal.isOpen} onClose={() => setModal({ isOpen: false })} title="Add New Project">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Project Name" id="projectName" type="text" value={projectName} onChange={e => setProjectName(e.target.value)} required />
                <div className="flex justify-end gap-4 pt-4">
                    <Button onClick={() => setModal({ isOpen: false })} variant="secondary" type="button">Cancel</Button>
                    <Button type="submit">Create Project</Button>
                </div>
            </form>
        </Modal>
    );
};

const LimitReachedModal = ({ modal, setModal, projects, onDeleteProject }) => {
     const [projectToDelete, setProjectToDelete] = useState('');

    if (modal.type !== 'limitReached') return null;
    
    const handleSubmit = () => {
        const project = projects.find(p => p.id === projectToDelete);
        if (project) {
            onDeleteProject(project);
        } else {
            alert("Please select a project to delete.");
        }
    }

    return (
        <Modal isOpen={modal.isOpen} onClose={() => setModal({ isOpen: false })} title="Project Limit Reached">
            <p className="text-gray-600 dark:text-gray-300 mb-4">You have reached the maximum of 5 projects. To add a new one, you must delete an existing project.</p>
            <div className="space-y-4">
                <Select label="Select Project to Delete" id="project-to-delete" value={projectToDelete} onChange={(e) => setProjectToDelete(e.target.value)}>
                    <option value="">-- Please choose a project --</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </Select>
                <div className="flex justify-end gap-4 pt-4">
                    <Button onClick={() => setModal({ isOpen: false })} variant="secondary" type="button">Cancel</Button>
                    <Button onClick={handleSubmit} variant="danger" disabled={!projectToDelete}>Delete and Continue</Button>
                </div>
            </div>
        </Modal>
    );
}

const ProjectSettings = ({ project, onEditProject, onDeleteProject, onAddContributor, onRemoveContributor, onUpdateContributorRole, userRole }) => {
    const [name, setName] = useState(project.name);
    const [contributorEmail, setContributorEmail] = useState('');
    const [contributorRole, setContributorRole] = useState('read');

    const handleNameSubmit = (e) => {
        e.preventDefault();
        onEditProject(project.id, name);
    };
    
    const handleAddContributor = (e) => {
        e.preventDefault();
        if (!contributorEmail) {
            alert("Please enter a contributor's email.");
            return;
        }
        onAddContributor(project, contributorEmail, contributorRole);
        setContributorEmail('');
    }
    
    const handleDeleteData = () => {
        alert('Deleting all project data is a highly destructive action. This feature should be implemented with extreme care, possibly using a Cloud Function for reliability.');
    }

    if(userRole !== 'owner') {
        return <Card><p>You do not have permission to view project settings.</p></Card>
    }

    return (
        <div className="space-y-8">
            <Card>
                <h3 className="text-xl font-bold mb-4">Edit Project Name</h3>
                <form onSubmit={handleNameSubmit} className="flex gap-4 items-end">
                    <div className='flex-grow'>
                        <Input label="Project Name" id="editProjectName" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <Button type="submit">Save Name</Button>
                </form>
            </Card>
            <Card>
                 <h3 className="text-xl font-bold mb-4">Manage Contributors</h3>
                 <form onSubmit={handleAddContributor} className="flex gap-4 items-end mb-6">
                     <div className='flex-grow'>
                        <Input label="Contributor Email" id="contributorEmail" type="email" value={contributorEmail} onChange={e => setContributorEmail(e.target.value)} required />
                     </div>
                     <div className='flex-grow'>
                        <Select label="Role" id="contributorRole" value={contributorRole} onChange={e => setContributorRole(e.target.value)}>
                            <option value="read">Read-Only</option>
                            <option value="read-write">Read & Write</option>
                            <option value="dashboard-transactions">Dashboard & Transactions</option>
                        </Select>
                     </div>
                    <Button type="submit">Add Contributor</Button>
                 </form>
                 <div className="space-y-2">
                     <h4 className="text-lg font-semibold">Current Contributors</h4>
                     <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                         <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                             <tr>
                                 <th scope="col" className="px-6 py-3">Email</th>
                                 <th scope="col" className="px-6 py-3">Role</th>
                                 <th scope="col" className="px-6 py-3">Action</th>
                             </tr>
                         </thead>
                         <tbody>
                            <tr className="bg-white dark:bg-gray-800">
                                <td className="px-6 py-4">{project.ownerEmail}</td>
                                <td className="px-6 py-4">Owner</td>
                                <td className="px-6 py-4"></td>
                            </tr>
                            {project.contributors && Object.entries(project.contributors).map(([email, role]) => (
                                <tr key={email} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                                    <td className="px-6 py-4">{email.replace(/_/g, '.')}</td>
                                    <td className="px-6 py-4">
                                        <Select value={role} onChange={(e) => onUpdateContributorRole(project, email.replace(/_/g, '.'), e.target.value)} id={`role-${email}`}>
                                            <option value="read">Read-Only</option>
                                            <option value="read-write">Read & Write</option>
                                            <option value="dashboard-transactions">Dashboard & Transactions</option>
                                        </Select>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => onRemoveContributor(project, email.replace(/_/g, '.'))} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                                    </td>
                                </tr>
                             ))}
                         </tbody>
                     </table>
                 </div>
            </Card>
            <Card>
                <h3 className="text-xl font-bold text-red-500 mb-4">Danger Zone</h3>
                <div className="space-y-4">
                     <Button onClick={handleDeleteData} variant="danger" className="w-full justify-start">
                        Delete All Content in This Project
                    </Button>
                    <Button onClick={() => onDeleteProject(project)} variant="danger" className="w-full justify-start">
                        Permanently Delete This Project
                    </Button>
                </div>
            </Card>
        </div>
    );
};

const NavLink = ({ label, viewName, currentView, setView, setIsSidebarOpen }) => (
    <li>
        <button
           onClick={() => { setView(viewName); setIsSidebarOpen(false); }}
           className={`flex items-center p-2 text-base font-normal rounded-lg transition-colors duration-200 w-full text-left ${currentView === viewName ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <Icon path={ICONS[viewName]} className={`w-6 h-6 ${currentView === viewName ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} />
            <span className="ml-3">{label}</span>
        </button>
    </li>
);

export default App;
