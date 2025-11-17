/**
 * Calculate days remaining until a deadline
 * @param {string} deadline - Date string in YYYY-MM-DD format
 * @returns {number} - Number of days remaining (negative if overdue)
 */
export const getDaysRemaining = (deadline) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  
  const diffTime = deadlineDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Check if a deadline is overdue
 * @param {string} deadline - Date string in YYYY-MM-DD format
 * @returns {boolean} - True if overdue
 */
export const isOverdue = (deadline) => {
  return getDaysRemaining(deadline) < 0;
};

/**
 * Format date to readable string
 * @param {string} date - Date string in YYYY-MM-DD format
 * @returns {string} - Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  
  return dateObj.toLocaleDateString('en-US', options);
};
