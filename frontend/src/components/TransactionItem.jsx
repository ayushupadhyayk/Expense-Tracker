import { findCategory } from '../utils/categories'
import { formatDate, formatMoney } from '../utils/format'

function TransactionItem({item, onEdit, onDelete, isEditing}) {
    const category = findCategory(item.type, item.category)
    const isExpense = item.type === 'expense'

    return (
        <div className={`card item ${isEditing ? 'is-editing' : ''}`}>
            <div className={`item-icon ${isExpense ? 'negative' : 'positive'}`}>
                <i className={`${category.brand ? 'fa-brands' : 'fa-solid'} ${category.icon}`}></i>
            </div>
            <div className="item-body">
                <h3>
                    <span className={`dot ${isExpense ? 'dot-expense' : 'dot-income'}`}></span>
                    {item.title}
                </h3>
                <div className="item-meta">
                    <span className={isExpense ? 'negative' : 'positive'}>
                        {isExpense ? '−' : '+'}{formatMoney(item.amount)}
                    </span>
                    <span><i className="fa-solid fa-calendar"></i> {formatDate(item.date)}</span>
                    <span><i className="fa-solid fa-tag"></i> {category.label}</span>
                    <span className="item-desc"><i className="fa-solid fa-comment"></i> {item.description}</span>
                </div>
            </div>
            <div className="item-actions">
                {onEdit && (
                    <button className="icon-btn" onClick={() => onEdit(item)} aria-label={`Edit ${item.title}`} title="Edit">
                        <i className="fa-solid fa-pen"></i>
                    </button>
                )}
                <button
                    className="icon-btn danger"
                    onClick={() => window.confirm(`Delete "${item.title}"?`) && onDelete(item)}
                    aria-label={`Delete ${item.title}`}
                    title="Delete"
                >
                    <i className="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    )
}

export default TransactionItem
