// Returns an error message for an invalid transaction body, or null if it is valid.
const validateTransaction = ({title, amount, category, description, date} = {}) => {
    if(!title || !category || !description || !date){
        return 'All fields are required!'
    }
    const value = Number(amount)
    if(amount === '' || amount === null || !Number.isFinite(value) || value <= 0){
        return 'Amount must be a positive number!'
    }
    if(Number.isNaN(new Date(date).getTime())){
        return 'Date is invalid!'
    }
    if(String(title).trim().length > 50){
        return 'Title must be 50 characters or fewer!'
    }
    if(String(description).trim().length > 100){
        return 'Description must be 100 characters or fewer!'
    }
    return null
}

module.exports = {validateTransaction}
