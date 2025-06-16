const express = require('express');
const router = express.Router();
const { createExpense, createUnequalExpense, getExpensesByGroup, getAllExpenses } = require('../controllers/expenseController');
const protect = require('../middleware/authMiddleware');

// All expense routes require authentication
router.use(protect);

// Expense routes
router.post('/', createExpense);
router.post('/add', createExpense); // Alternative endpoint for compatibility
router.post('/unequal', createUnequalExpense); // New route for unequal expenses
router.get('/', getAllExpenses);
router.get('/group/:groupId', getExpensesByGroup);

module.exports = router;