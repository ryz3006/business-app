import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, doc, onSnapshot, deleteDoc, updateDoc, query, orderBy, where, getDocs, writeBatch, getDoc } from 'firebase/firestore';
import * as Recharts from 'recharts';

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

// --- SVG Icons ---

const Icon = ({ path, className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
);

const Spinner = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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

const Button = ({ onClick, children, className = "", variant = 'primary', isLoading = false, ...props }) => {
    const baseClasses = "px-4 py-2 rounded-lg font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
    const variants = {
        primary: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500',
        danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    };
    return (
        <button onClick={onClick} className={`${baseClasses} ${variants[variant]} ${className}`} disabled={isLoading} {...props}>
            {isLoading ? <Spinner/> : children}
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

const TextArea = React.forwardRef(({ label, id, ...props }, ref) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <textarea id={id} {...props} ref={ref} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white" />
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

const Toast = ({ message, show, type = 'success' }) => {
    if (!show) return null;

    const baseClasses = "fixed bottom-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg text-white transition-opacity duration-300";
    const typeClasses = {
        success: 'bg-green-500',
        error: 'bg-red-500',
    }

    return (
        <div className={`${baseClasses} ${typeClasses[type]}`}>
            {message}
        </div>
    );
};


// --- Core Feature Components ---

const Dashboard = ({ transactions, invoices, setView, exportLibsLoaded, user, selectedProject }) => {
    // State for date range filtering
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    // Top-level stats (always up-to-date)
    const overallStats = useMemo(() => {
        const currentBalance = transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
        const pendingInvoices = invoices.filter(i => i.status === 'pending');
        
        return { currentBalance, pendingInvoices };
    }, [transactions, invoices]);
    
    // Data filtered by the selected date range
    const filteredTransactions = useMemo(() => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include the whole end day
        return transactions.filter(t => {
            const tDate = t.createdAt.seconds ? new Date(t.createdAt.seconds * 1000) : new Date();
            return tDate >= start && tDate <= end;
        });
    }, [transactions, startDate, endDate]);

    const rangeStats = useMemo(() => {
        const incomeInRange = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expensesInRange = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        return { incomeInRange, expensesInRange };
    }, [filteredTransactions]);

    const cashFlowData = useMemo(() => {
        const flow = {};
        filteredTransactions.forEach(t => {
            const date = new Date(t.createdAt.seconds * 1000).toISOString().split('T')[0];
            if(!flow[date]) {
                flow[date] = { date, income: 0, expense: 0 };
            }
            if (t.type === 'income') flow[date].income += t.amount;
            if (t.type === 'expense') flow[date].expense += t.amount;
        });
        return Object.values(flow).sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [filteredTransactions]);

    const expenseByCategory = useMemo(() => {
        const categoryMap = {};
        filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
            const category = t.category || 'Uncategorized';
            categoryMap[category] = (categoryMap[category] || 0) + t.amount;
        });
        return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
    }, [filteredTransactions]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560'];

    const handlePresetChange = (e) => {
        const value = e.target.value;
        const today = new Date();
        const end = new Date();
        let start = new Date();

        switch(value) {
            case 'today':
                start = today;
                break;
            case '7d':
                start.setDate(today.getDate() - 7);
                break;
            case 'this_month':
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
            case '3m':
                start.setMonth(today.getMonth() - 3);
                break;
            case '6m':
                start.setMonth(today.getMonth() - 6);
                break;
            case '1y':
                start.setFullYear(today.getFullYear() - 1);
                break;
            default:
                return;
        }
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
    };
    
    const exportReportPDF = () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text(`Cash Flow Report: ${selectedProject.name}`, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Date Range: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`, 14, 30);

        doc.autoTable({
            startY: 40,
            head: [['Date', 'Description', 'Category', 'User', 'Income', 'Expense']],
            body: filteredTransactions.map(t => [
                new Date(t.createdAt.seconds * 1000).toLocaleString(),
                t.description,
                t.category,
                t.user,
                t.type === 'income' ? `${selectedProject.defaultCurrency || '₹'}${t.amount.toLocaleString('en-IN')}` : '-',
                t.type === 'expense' ? `${selectedProject.defaultCurrency || '₹'}${t.amount.toLocaleString('en-IN')}` : '-'
            ]),
        });
        
        const finalY = doc.lastAutoTable.finalY || 10;
        doc.setFontSize(8);
        doc.setTextColor(150);
        const footerText = `Generated using Amigos - Business App by ${user.displayName} on ${new Date().toLocaleString()}`;
        doc.text(footerText, 14, finalY + 15);

        doc.save(`Report-${selectedProject.name}-${startDate}-to-${endDate}.pdf`);
    }
    
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="lg:col-span-1 bg-gradient-to-br from-green-400 to-green-600 text-white">
                    <h4 className="font-bold text-lg">Current Balance</h4>
                    <p className="text-3xl font-bold mt-2">₹{overallStats.currentBalance.toLocaleString('en-IN')}</p>
                </Card>
                <Card className="lg:col-span-1 bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                    <h4 className="font-bold text-lg">Income (Selected Range)</h4>
                    <p className="text-3xl font-bold mt-2">₹{rangeStats.incomeInRange.toLocaleString('en-IN')}</p>
                </Card>
                <Card className="lg:col-span-1 bg-gradient-to-br from-red-400 to-red-600 text-white">
                    <h4 className="font-bold text-lg">Expenses (Selected Range)</h4>
                    <p className="text-3xl font-bold mt-2">₹{rangeStats.expensesInRange.toLocaleString('en-IN')}</p>
                </Card>
                <Card className="lg:col-span-1 bg-gradient-to-br from-yellow-400 to-yellow-600 text-white cursor-pointer" onClick={() => setView('invoices')}>
                    <h4 className="font-bold text-lg">Pending Invoices</h4>
                    <p className="text-3xl font-bold mt-2">{overallStats.pendingInvoices.length}</p>
                </Card>
            </div>

            <Card>
                <h3 className="text-xl font-bold mb-4">Cash Flow Report</h3>
                <div className="flex flex-wrap gap-4 items-end mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex-grow">
                        <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">From</label>
                        <Input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                     <div className="flex-grow">
                        <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">To</label>
                        <Input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                     <div className="flex-grow">
                        <label htmlFor="presets" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Presets</label>
                        <Select id="presets" onChange={handlePresetChange}>
                            <option value="">Select range</option>
                            <option value="today">Today</option>
                            <option value="7d">Last 7 Days</option>
                            <option value="this_month">This Month</option>
                            <option value="3m">Last 3 Months</option>
                            <option value="6m">Last 6 Months</option>
                            <option value="1y">Last 1 Year</option>
                        </Select>
                    </div>
                    <Button onClick={exportReportPDF} variant="secondary" disabled={!exportLibsLoaded}>
                        <Icon path={ICONS.download} className="w-5 h-5"/> Download PDF
                    </Button>
                </div>
                
                <h4 className="font-semibold text-lg mb-2">Cash Flow</h4>
                <Recharts.ResponsiveContainer width="100%" height={300}>
                    <Recharts.LineChart data={cashFlowData}>
                        <Recharts.CartesianGrid strokeDasharray="3 3" />
                        <Recharts.XAxis dataKey="date" />
                        <Recharts.YAxis />
                        <Recharts.Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`}/>
                        <Recharts.Legend />
                        <Recharts.Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} />
                        <Recharts.Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} />
                    </Recharts.LineChart>
                </Recharts.ResponsiveContainer>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">Expense Breakdown</h3>
                    <Recharts.ResponsiveContainer width="100%" height={300}>
                        <Recharts.PieChart>
                            <Recharts.Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                                {expenseByCategory.map((entry, index) => (
                                    <Recharts.Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Recharts.Pie>
                            <Recharts.Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
                            <Recharts.Legend />
                        </Recharts.PieChart>
                    </Recharts.ResponsiveContainer>
                </Card>

                <Card>
                     <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">Recent Transactions</h3>
                     <div className="space-y-3 max-h-72 overflow-y-auto">
                        {transactions.slice(0, 10).map(t => (
                            <div key={t.id} className="flex justify-between items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                               <div>
                                   <p className="font-semibold text-gray-800 dark:text-white">{t.description}</p>
                                   <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(t.createdAt.seconds * 1000).toLocaleString()} by {t.user}</p>
                               </div>
                                <p className={`font-bold ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                    {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                                </p>
                            </div>
                        ))}
                     </div>
                </Card>
            </div>
        </div>
    );
};

const TransactionForm = ({ onSave, onCancel, transaction, categories, allTags }) => {
    const [type, setType] = useState(transaction?.type || 'expense');
    const [amount, setAmount] = useState(transaction?.amount || '');
    const [category, setCategory] = useState(transaction?.category || '');
    const [date, setDate] = useState(transaction?.date || new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState(transaction?.description || '');
    const [tags, setTags] = useState(transaction?.tags?.join(', ') || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!category) {
            alert("Please select or enter a category.");
            return;
        }
        setIsSaving(true);
        await onSave({
            type,
            amount: parseFloat(amount),
            category,
            date,
            description,
            tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
        });
        setIsSaving(false);
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Select label="Type" id="type" value={type} onChange={e => setType(e.target.value)}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
            </Select>
            <Input label="Amount" id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} required step="0.01" />
            <Input label="Description" id="description" type="text" value={description} onChange={e => setDescription(e.target.value)} required />
            
            <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <Input list="category-suggestions" id="category" type="text" value={category} onChange={e => setCategory(e.target.value)} required placeholder="e.g., Food, Travel, Salary" />
                <datalist id="category-suggestions">
                    {categories.map(cat => <option key={cat} value={cat} />)}
                </datalist>
            </div>
            
            <Input label="Date" id="date" type="date" value={date} onChange={e => setDate(e.target.value)} required />

            <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma-separated)</label>
                <Input list="tag-suggestions" id="tags" type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g., business, personal" />
                 <datalist id="tag-suggestions">
                    {allTags.map(tag => <option key={tag} value={tag} />)}
                </datalist>
            </div>

            <div className="flex justify-end gap-4 pt-4">
                <Button onClick={onCancel} variant="secondary" type="button">Cancel</Button>
                <Button type="submit" isLoading={isSaving}>Save</Button>
            </div>
        </form>
    );
};

const Transactions = ({ user, selectedProject, transactions, setTransactions, categories, allTags, exportLibsLoaded, userRole, showToast }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [filter, setFilter] = useState('all');

    const canWrite = userRole === 'owner' || userRole?.write?.includes('transactions');

    const handleSave = async (data) => {
        if (!user || !selectedProject || !canWrite) return;
        try {
            const path = `projects/${selectedProject.id}/transactions`;
            if (editingTransaction) {
                const docRef = doc(db, path, editingTransaction.id);
                await updateDoc(docRef, data);
                showToast("Transaction updated successfully!");
            } else {
                await addDoc(collection(db, path), {
                    ...data,
                    user: user.displayName,
                    userEmail: user.email,
                    createdAt: new Date(),
                });
                showToast("Transaction added successfully!");
            }
        } catch (error) {
            console.error("Error saving transaction: ", error);
            showToast("Failed to save transaction.", "error");
        }
        setIsModalOpen(false);
        setEditingTransaction(null);
    };

    const handleDelete = async (id) => {
        if (!user || !selectedProject || !canWrite || !window.confirm('Are you sure you want to delete this transaction?')) return;
        try {
            const path = `projects/${selectedProject.id}/transactions`;
            await deleteDoc(doc(db, path, id));
            showToast("Transaction deleted.");
        } catch (error) {
            console.error("Error deleting transaction: ", error);
            showToast("Failed to delete transaction.", "error");
        }
    };
    
    const exportToPDF = () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text(`Transactions for ${selectedProject.name}`, 14, 22);

        doc.autoTable({
            startY: 30,
            head: [['Date', 'Description', 'Category', 'User', 'Amount']],
            body: transactions.map(t => [
                new Date(t.createdAt.seconds * 1000).toLocaleString(),
                t.description,
                t.category,
                t.user,
                `${selectedProject.defaultCurrency || '₹'}${t.amount.toLocaleString('en-IN')}`
            ]),
        });
        
        const finalY = doc.lastAutoTable.finalY || 10;
        doc.setFontSize(8);
        doc.setTextColor(150);
        const footerText = `Generated using Amigos - Business App by ${user.displayName} on ${new Date().toLocaleString()}`;
        doc.text(footerText, 14, finalY + 15);

        doc.save(`${selectedProject.name}-transactions.pdf`);
    };

    const exportToExcel = () => {
        const { XLSX } = window;
        const data = transactions.map(t => ({
            Date: new Date(t.createdAt.seconds * 1000).toLocaleString(),
            Description: t.description,
            Category: t.category,
            User: t.user,
            Amount: t.amount,
            Tags: t.tags?.join(', ')
        }));
        data.push({}); // Spacer row
        data.push({Date: `Report for: ${selectedProject.name}`});
        data.push({Date: `Downloaded by: ${user.displayName}`});
        data.push({Date: `Downloaded on: ${new Date().toLocaleString()}`});
        data.push({Date: "Generated using Amigos - Business App"});

        const worksheet = XLSX.utils.json_to_sheet(data, {skipHeader: true});
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
                <TransactionForm onSave={handleSave} onCancel={() => setIsModalOpen(false)} transaction={editingTransaction} categories={categories} allTags={allTags}/>
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
                                <td className="px-6 py-4">{new Date(t.createdAt.seconds * 1000).toLocaleString()}</td>
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
    const [tax, setTax] = useState(invoice?.tax || 0);
    const [dueDate, setDueDate] = useState(invoice?.dueDate || new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState(invoice?.status || 'pending');
    const [serviceDetails, setServiceDetails] = useState(invoice?.serviceDetails || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave({
            clientName,
            amount: parseFloat(amount),
            tax: parseFloat(tax) || 0,
            dueDate,
            status,
            serviceDetails
        });
        setIsSaving(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Client Name" id="clientName" type="text" value={clientName} onChange={e => setClientName(e.target.value)} required />
            <TextArea label="Service Details" id="serviceDetails" value={serviceDetails} onChange={e => setServiceDetails(e.target.value)} placeholder="e.g., Web Development Services for Q2" />
            <Input label="Amount" id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} required step="0.01" />
            <Input label="Tax (%)" id="tax" type="number" value={tax} onChange={e => setTax(e.target.value)} step="0.01" />
            <Input label="Due Date" id="dueDate" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
            <Select label="Status" id="status" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
            </Select>
            <div className="flex justify-end gap-4 pt-4">
                <Button onClick={onCancel} variant="secondary" type="button">Cancel</Button>
                <Button type="submit" isLoading={isSaving}>Save Invoice</Button>
            </div>
        </form>
    );
};

const Invoices = ({ user, selectedProject, invoices, setInvoices, exportLibsLoaded, userRole, showToast, setModal, handleAddTransaction }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState(null);

    const canWrite = userRole === 'owner' || userRole?.write?.includes('invoices');
    
    const handleSave = async (data) => {
        if (!user || !selectedProject || !canWrite) return;
        try {
            const path = `projects/${selectedProject.id}/invoices`;
            const invoiceData = { ...data, user: user.displayName, userEmail: user.email };
            
            if (editingInvoice) {
                const docRef = doc(db, path, editingInvoice.id);
                await updateDoc(docRef, invoiceData);
                showToast("Invoice updated!");
            } else {
                await addDoc(collection(db, path), {
                    ...invoiceData,
                    createdAt: new Date(),
                    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`
                });
                showToast("Invoice added!");
            }
        } catch (error) {
            console.error("Error saving invoice: ", error);
            showToast("Failed to save invoice.", "error");
        }
        setIsModalOpen(false);
        setEditingInvoice(null);
    };
    
    const handleDelete = async (id) => {
        if (!user || !selectedProject || !canWrite || !window.confirm('Are you sure? This will delete the invoice record.')) return;
        try {
            const path = `projects/${selectedProject.id}/invoices`;
            await deleteDoc(doc(db, path, id));
            showToast("Invoice deleted.");
        } catch (error) {
            console.error("Error deleting invoice: ", error);
            showToast("Failed to delete invoice.", "error");
        }
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
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Invoices & Bills</h2>
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
                        <p className="text-2xl font-bold text-gray-900 dark:text-white my-4">{selectedProject.defaultCurrency || '₹'}{inv.amount.toLocaleString('en-IN')}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Due: {new Date(inv.dueDate).toLocaleDateString()}</p>
                        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                             <Button onClick={() => setModal({isOpen: true, type: 'generateBill', data: inv})} disabled={!exportLibsLoaded} className="flex-1" variant="secondary">
                                Generate Bill
                            </Button>
                            <button onClick={() => { setEditingInvoice(inv); setIsModalOpen(true); }} className="text-blue-500 hover:text-blue-700 p-2" disabled={!canWrite}><Icon path={ICONS.edit} /></button>
                            <button onClick={() => handleDelete(inv.id)} className="text-red-500 hover:text-red-700 p-2" disabled={!canWrite}><Icon path={ICONS.delete} /></button>
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
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // Data states
    const [transactions, setTransactions] = useState([]);
    const [invoices, setInvoices] = useState([]);
    
    const allProjects = useMemo(() => {
        const projectMap = new Map();
        [...projects, ...sharedProjects].forEach(p => projectMap.set(p.id, p));
        return Array.from(projectMap.values());
    }, [projects, sharedProjects]);

    const categories = useMemo(() => {
        const catSet = new Set(transactions.map(t => t.category));
        return Array.from(catSet);
    }, [transactions]);
    
    const allTags = useMemo(() => {
        const tagSet = new Set();
        transactions.forEach(t => {
            t.tags?.forEach(tag => tagSet.add(tag));
        });
        return Array.from(tagSet);
    }, [transactions]);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type }), 3000);
    };

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
        const sharedProjectsQuery = query(collection(db, 'projects'), where("contributorEmails", 'array-contains', user.email));
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
                 setSelectedProject(prev => ({...prev, ...doc.data(), id: doc.id}));
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
            setUserRole(role || { read: [], write: [] });
        }

        const projectPath = `projects/${selectedProject.id}`;

        const transactionQuery = query(collection(db, projectPath, 'transactions'), orderBy('createdAt', 'desc'));
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
                contributors: {},
                contributorEmails: []
            });
            showToast("Project created successfully!");
            setModal({ isOpen: false });
        } catch (error) {
            console.error("Error adding project:", error);
            showToast("Error creating project.", "error");
        }
    };

    const handleEditProjectSettings = async (projectId, settings) => {
        if(!user) return;
        try {
            const docRef = doc(db, `projects/${projectId}`);
            await updateDoc(docRef, settings);
            showToast("Project settings updated!");
        } catch (error) {
            console.error("Error updating project settings:", error);
            showToast("Error updating settings.", "error");
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
            showToast("Project deleted successfully.");

        } catch (error) {
            console.error("Error deleting project:", error);
            showToast("Error deleting project.", "error");
        }
    }

    const handleAddOrUpdateContributor = async (project, email, permissions) => {
        if (!user || project.ownerId !== user.uid) return;
        const sanitizedEmail = email.replace(/\./g, '_');
        const projectRef = doc(db, `projects/${project.id}`);
        try {
            const projectSnap = await getDoc(projectRef);
             if (projectSnap.exists()) {
                const currentContributors = projectSnap.data().contributors || {};
                const currentEmails = projectSnap.data().contributorEmails || [];
                
                const newContributors = {...currentContributors, [sanitizedEmail]: permissions };
                const newEmails = [...new Set([...currentEmails, email])];

                await updateDoc(projectRef, {
                    contributors: newContributors,
                    contributorEmails: newEmails
                });
                showToast("Contributor permissions saved!");
             }
        } catch (error) {
            console.error("Error adding/updating contributor:", error);
            showToast("Failed to save contributor.", "error");
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

                const updatedEmails = (projectSnap.data().contributorEmails || []).filter(e => e !== email);

                await updateDoc(projectRef, {
                    contributors: updatedContributors,
                    contributorEmails: updatedEmails
                });
                showToast("Contributor removed.");
            }
        } catch(e) {
            console.error("Error removing contributor", e);
            showToast("Failed to remove contributor.", "error");
        }
    }

    const handleAddTransactionFromBill = async (invoice, totalAmount) => {
        if (!user || !selectedProject) return;
        const canWrite = userRole === 'owner' || userRole?.write?.includes('transactions');
        if (!canWrite) return;
        
        try {
            const path = `projects/${selectedProject.id}/transactions`;
            await addDoc(collection(db, path), {
                amount: totalAmount,
                category: "Invoice Payment",
                date: new Date().toISOString().split('T')[0],
                description: `Payment for Invoice ${invoice.invoiceNumber}`,
                tags: ['invoice', 'payment'],
                type: 'income',
                user: user.displayName,
                userEmail: user.email,
                createdAt: new Date(),
            });
            showToast("Income transaction created for bill payment!");
        } catch (error) {
            console.error("Error creating transaction from bill:", error);
            showToast("Failed to create income transaction.", "error");
        }
    };


    const renderView = () => {
        switch (view) {
            case 'dashboard':
                return <Dashboard transactions={transactions} invoices={invoices} setView={setView} exportLibsLoaded={exportLibsLoaded} user={user} selectedProject={selectedProject}/>;
            case 'transactions':
                return <Transactions user={user} selectedProject={selectedProject} transactions={transactions} setTransactions={setTransactions} categories={categories} allTags={allTags} exportLibsLoaded={exportLibsLoaded} userRole={userRole} showToast={showToast}/>;
            case 'invoices':
                return <Invoices user={user} selectedProject={selectedProject} invoices={invoices} setInvoices={setInvoices} exportLibsLoaded={exportLibsLoaded} userRole={userRole} showToast={showToast} setModal={setModal}/>;
            case 'settings':
                return <ProjectSettings project={selectedProject} onEditProject={handleEditProjectSettings} onDeleteProject={handleDeleteProject} onAddContributor={handleAddOrUpdateContributor} onRemoveContributor={handleRemoveContributor} userRole={userRole} setModal={setModal} showToast={showToast} />;
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
            <Toast {...toast} />
            {/* Modals */}
            <ProjectModal modal={modal} setModal={setModal} onAddProject={handleAddProject} />
            <LimitReachedModal modal={modal} setModal={setModal} projects={projects} onDeleteProject={handleDeleteProject} />
            <EditContributorModal modal={modal} setModal={setModal} project={selectedProject} onSave={handleAddOrUpdateContributor} />
            <BillGenerationModal modal={modal} setModal={setModal} project={selectedProject} user={user} showToast={showToast} onAddTransaction={handleAddTransactionFromBill} />
            
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
                        {(userRole === 'owner' || userRole?.read?.includes('dashboard')) && <NavLink label="Dashboard" viewName="dashboard" currentView={view} setView={setView} setIsSidebarOpen={setIsSidebarOpen} />}
                        {(userRole === 'owner' || userRole?.read?.includes('transactions')) && <NavLink label="Transactions" viewName="transactions" currentView={view} setView={setView} setIsSidebarOpen={setIsSidebarOpen} />}
                        {(userRole === 'owner' || userRole?.read?.includes('invoices')) && <NavLink label="Invoices & Bills" viewName="invoices" currentView={view} setView={setView} setIsSidebarOpen={setIsSidebarOpen} />}
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
                        <h1 className="text-4xl font-bold text-gray-800 dark:text-white">Amigos</h1>
                        <p className="text-xl font-light text-blue-600 dark:text-blue-400">Business Manager</p>
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
    const [isSaving, setIsSaving] = useState(false);

    if (modal.type !== 'addProject') return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        await onAddProject(projectName);
        setIsSaving(false);
        setProjectName('');
    }

    return (
        <Modal isOpen={modal.isOpen} onClose={() => setModal({ isOpen: false })} title="Add New Project">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Project Name" id="projectName" type="text" value={projectName} onChange={e => setProjectName(e.target.value)} required />
                <div className="flex justify-end gap-4 pt-4">
                    <Button onClick={() => setModal({ isOpen: false })} variant="secondary" type="button">Cancel</Button>
                    <Button type="submit" isLoading={isSaving}>Create Project</Button>
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

const EditContributorModal = ({ modal, setModal, project, onSave }) => {
    const { email, perms } = modal.data || {};
    const [permissions, setPermissions] = useState(perms || { read: [], write: [] });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if(modal.data?.perms) {
            setPermissions(modal.data.perms);
        }
    }, [modal.data]);

    if (modal.type !== 'editContributor') return null;

    const handlePermissionChange = (type, page, checked) => {
        setPermissions(prev => {
            const currentPerms = new Set(prev[type]);
            if (checked) {
                currentPerms.add(page);
                if(type === 'write' && !prev.read.includes(page)) {
                    const readPerms = new Set(prev.read);
                    readPerms.add(page);
                    return { ...prev, read: Array.from(readPerms), write: Array.from(currentPerms) };
                }
            } else {
                currentPerms.delete(page);
                if(type === 'read' && prev.write.includes(page)) {
                    const writePerms = new Set(prev.write);
                    writePerms.delete(page);
                    return { ...prev, read: Array.from(currentPerms), write: Array.from(writePerms) };
                }
            }
            return { ...prev, [type]: Array.from(currentPerms) };
        });
    };
    
    const handleSave = async () => {
        setIsSaving(true);
        await onSave(project, email, permissions);
        setIsSaving(false);
        setModal({ isOpen: false });
    }

    return (
        <Modal isOpen={modal.isOpen} onClose={() => setModal({isOpen: false})} title={`Edit Permissions for ${email}`}>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h4 className='font-semibold mb-2'>Read Access</h4>
                        <div className='space-y-2'>
                            <label className='flex items-center gap-2'><input type="checkbox" onChange={e => handlePermissionChange('read', 'dashboard', e.target.checked)} checked={permissions.read.includes('dashboard')}/> Dashboard</label>
                            <label className='flex items-center gap-2'><input type="checkbox" onChange={e => handlePermissionChange('read', 'transactions', e.target.checked)} checked={permissions.read.includes('transactions')}/> Transactions</label>
                            <label className='flex items-center gap-2'><input type="checkbox" onChange={e => handlePermissionChange('read', 'invoices', e.target.checked)} checked={permissions.read.includes('invoices')}/> Invoices</label>
                        </div>
                    </div>
                     <div>
                        <h4 className='font-semibold mb-2'>Write Access</h4>
                        <div className='space-y-2'>
                            <label className='flex items-center gap-2'><input type="checkbox" onChange={e => handlePermissionChange('write', 'transactions', e.target.checked)} checked={permissions.write.includes('transactions')}/> Transactions</label>
                            <label className='flex items-center gap-2'><input type="checkbox" onChange={e => handlePermissionChange('write', 'invoices', e.target.checked)} checked={permissions.write.includes('invoices')}/> Invoices</label>
                        </div>
                    </div>
                 </div>
                <div className="flex justify-end gap-4 pt-4">
                    <Button onClick={() => setModal({isOpen: false})} variant="secondary">Cancel</Button>
                    <Button onClick={handleSave} isLoading={isSaving}>Save Changes</Button>
                </div>
            </div>
        </Modal>
    );
};

const BillGenerationModal = ({ modal, setModal, project, user, showToast, onAddTransaction }) => {
    const { data: invoice } = modal;
    const [status, setStatus] = useState(invoice?.status || 'pending');
    const [addAsIncome, setAddAsIncome] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    if (modal.type !== 'generateBill') return null;

    const generateBillPDF = (invoice) => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const companyName = project.companyName || "Your Company";
        const currency = project.defaultCurrency || '₹';
        const companyContact = `${project.companyContactMail || ''} ${project.companyContactNumber || ''}`.trim();

        doc.setFontSize(22);
        doc.text("Bill", 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text(companyName, 14, 30);
        
        doc.text(`Bill For: ${invoice.clientName}`, 14, 45);
        doc.text(`Invoice #: ${invoice.invoiceNumber}`, 140, 45);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 140, 52);

        const taxAmount = (invoice.amount * (invoice.tax || 0)) / 100;
        const totalAmount = invoice.amount + taxAmount;

        doc.autoTable({
            startY: 60,
            head: [['Description', 'Amount']],
            body: [
                [invoice.serviceDetails || 'Service/Product', `${currency}${invoice.amount.toLocaleString('en-IN')}`],
                [`Tax (${invoice.tax || 0}%)`, `${currency}${taxAmount.toLocaleString('en-IN')}`],
            ],
            foot: [
                [{ content: 'Total Amount Due', styles: { fontStyle: 'bold' } }, { content: `${currency}${totalAmount.toLocaleString('en-IN')}`, styles: { fontStyle: 'bold' } }],
            ]
        });

        let finalY = doc.lastAutoTable.finalY + 15;
        doc.setFontSize(10);
        doc.text("Payment Details:", 14, finalY);
        doc.text(project.paymentMethods || 'N/A', 14, finalY + 7);

        finalY = doc.lastAutoTable.finalY + 30;
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`This is an electronically generated invoice on behalf of '${project.name}' by '${companyName}', so no need to sign separately.`, 14, finalY + 15);
        if (companyContact) {
            doc.text(`Any concerns please connect ${companyContact}`, 14, finalY + 20);
        }
        
        doc.save(`Bill-${invoice.invoiceNumber}.pdf`);
    };

    const handleProcess = async () => {
        setIsProcessing(true);

        generateBillPDF(invoice);

        if (status !== invoice.status) {
            const invoiceRef = doc(db, `projects/${project.id}/invoices/${invoice.id}`);
            try {
                await updateDoc(invoiceRef, { status });
                showToast("Invoice status updated!");
            } catch (error) {
                showToast("Failed to update invoice status.", "error");
            }
        }

        if (addAsIncome) {
            const totalAmount = invoice.amount + (invoice.amount * (invoice.tax || 0)) / 100;
            await onAddTransaction(invoice, totalAmount);
        }
        
        setIsProcessing(false);
        setModal({ isOpen: false });
    };

    return (
        <Modal isOpen={modal.isOpen} onClose={() => setModal({isOpen: false})} title={`Generate Bill for INV-${invoice.invoiceNumber}`}>
            <div className="space-y-4">
                <div>
                    <Select label="Update Invoice Status" id="invoiceStatus" value={status} onChange={e => setStatus(e.target.value)}>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                    </Select>
                </div>
                <div>
                    <label className='flex items-center gap-2'>
                        <input type="checkbox" checked={addAsIncome} onChange={e => setAddAsIncome(e.target.checked)} />
                        <span>Add payment to transactions as Income</span>
                    </label>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <Button onClick={() => setModal({isOpen: false})} variant="secondary">Cancel</Button>
                    <Button onClick={handleProcess} isLoading={isProcessing}>Generate & Save</Button>
                </div>
            </div>
        </Modal>
    );
};


const ProjectSettings = ({ project, onEditProject, onDeleteProject, onAddContributor, onRemoveContributor, userRole, setModal, showToast }) => {
    const [name, setName] = useState(project.name);
    const [contributorEmail, setContributorEmail] = useState('');
    const [permissions, setPermissions] = useState({ read: [], write: [] });
    const [isSavingName, setIsSavingName] = useState(false);
    const [isAddingContributor, setIsAddingContributor] = useState(false);

    const [companyName, setCompanyName] = useState(project.companyName || '');
    const [companyContactMail, setCompanyContactMail] = useState(project.companyContactMail || '');
    const [companyContactNumber, setCompanyContactNumber] = useState(project.companyContactNumber || '');
    const [defaultCurrency, ] = useState('₹');
    const [paymentMethods, setPaymentMethods] = useState(project.paymentMethods || '');


    const handlePermissionChange = (type, page, checked) => {
        setPermissions(prev => {
            const currentPerms = new Set(prev[type]);
            if (checked) {
                currentPerms.add(page);
                if (type === 'write' && !prev.read.includes(page)) {
                    const readPerms = new Set(prev.read);
                    readPerms.add(page);
                    return { ...prev, read: Array.from(readPerms), write: Array.from(currentPerms) };
                }
            } else {
                currentPerms.delete(page);
                if (type === 'read' && prev.write.includes(page)) {
                    const writePerms = new Set(prev.write);
                    writePerms.delete(page);
                    return { ...prev, read: Array.from(currentPerms), write: Array.from(writePerms) };
                }
            }
            return { ...prev, [type]: Array.from(currentPerms) };
        });
    };

    const handleSettingsSubmit = async (e) => {
        e.preventDefault();
        setIsSavingName(true);
        await onEditProject(project.id, {
            name,
            companyName,
            companyContactMail,
            companyContactNumber,
            defaultCurrency,
            paymentMethods
        });
        setIsSavingName(false);
    };
    
    const handleAddContributor = async (e) => {
        e.preventDefault();
        if (!contributorEmail) {
            alert("Please enter a contributor's email.");
            return;
        }
        setIsAddingContributor(true);
        await onAddContributor(project, contributorEmail, permissions);
        setIsAddingContributor(false);
        setContributorEmail('');
        setPermissions({ read: [], write: [] });
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
                 <form onSubmit={handleSettingsSubmit} className="space-y-4">
                    <h3 className="text-xl font-bold mb-4">Project & Company Settings</h3>
                    <Input label="Project Name" id="editProjectName" value={name} onChange={e => setName(e.target.value)} />
                    <Input label="Company Name" id="companyName" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Your Company LLC" />
                    <Input label="Company Contact Email" id="companyContactMail" type="email" value={companyContactMail} onChange={e => setCompanyContactMail(e.target.value)} placeholder="contact@yourcompany.com"/>
                    <Input label="Company Contact Number" id="companyContactNumber" type="tel" value={companyContactNumber} onChange={e => setCompanyContactNumber(e.target.value)} placeholder="+1 234 567 890"/>
                    <Input label="Default Currency" id="defaultCurrency" value={defaultCurrency} disabled readOnly />
                    <TextArea label="Payment Methods" id="paymentMethods" value={paymentMethods} onChange={e => setPaymentMethods(e.target.value)} placeholder="e.g., Bank Transfer to Account #12345, UPI ID: yourid@bank" />
                    <Button type="submit" isLoading={isSavingName}>Save Settings</Button>
                </form>
            </Card>
            <Card>
                 <h3 className="text-xl font-bold mb-4">Manage Contributors</h3>
                 <form onSubmit={handleAddContributor} className="space-y-4 mb-6 border-b pb-6 dark:border-gray-700">
                     <Input label="New Contributor Email" id="contributorEmail" type="email" value={contributorEmail} onChange={e => setContributorEmail(e.target.value)} required />
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h4 className='font-semibold mb-2'>Read Access</h4>
                            <div className='space-y-2'>
                                <label className='flex items-center gap-2'><input type="checkbox" onChange={e => handlePermissionChange('read', 'dashboard', e.target.checked)} checked={permissions.read.includes('dashboard')}/> Dashboard</label>
                                <label className='flex items-center gap-2'><input type="checkbox" onChange={e => handlePermissionChange('read', 'transactions', e.target.checked)} checked={permissions.read.includes('transactions')}/> Transactions</label>
                                <label className='flex items-center gap-2'><input type="checkbox" onChange={e => handlePermissionChange('read', 'invoices', e.target.checked)} checked={permissions.read.includes('invoices')}/> Invoices</label>
                            </div>
                        </div>
                         <div>
                            <h4 className='font-semibold mb-2'>Write Access</h4>
                            <div className='space-y-2'>
                                <label className='flex items-center gap-2'><input type="checkbox" onChange={e => handlePermissionChange('write', 'transactions', e.target.checked)} checked={permissions.write.includes('transactions')}/> Transactions</label>
                                <label className='flex items-center gap-2'><input type="checkbox" onChange={e => handlePermissionChange('write', 'invoices', e.target.checked)} checked={permissions.write.includes('invoices')}/> Invoices</label>
                            </div>
                        </div>
                     </div>
                    <Button type="submit" isLoading={isAddingContributor}>Add Contributor</Button>
                 </form>
                 <div className="space-y-2">
                     <h4 className="text-lg font-semibold">Current Contributors</h4>
                     <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                         <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                             <tr>
                                 <th scope="col" className="px-6 py-3">Email</th>
                                 <th scope="col" className="px-6 py-3">Permissions</th>
                                 <th scope="col" className="px-6 py-3">Action</th>
                             </tr>
                         </thead>
                         <tbody>
                            <tr className="bg-white dark:bg-gray-800">
                                <td className="px-6 py-4">{project.ownerEmail}</td>
                                <td className="px-6 py-4 font-bold">Owner (Full Access)</td>
                                <td className="px-6 py-4"></td>
                            </tr>
                            {project.contributors && Object.entries(project.contributors).map(([email, perms]) => (
                                <tr key={email} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                                    <td className="px-6 py-4">{email.replace(/_/g, '.')}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs">
                                           <p><b>Read:</b> {perms.read.join(', ') || 'None'}</p>
                                           <p><b>Write:</b> {perms.write.join(', ') || 'None'}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => setModal({ isOpen: true, type: 'editContributor', data: { email: email.replace(/_/g, '.'), perms } })} className="text-blue-500 hover:text-blue-700 text-sm mr-4">Edit</button>
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
