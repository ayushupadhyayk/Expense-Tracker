import avatar from '../img/avatar.png'

function Navigation({pages, active, setActive, theme, toggleTheme}) {
    return (
        <nav className="panel nav">
            <div className="user">
                <img src={avatar} alt="" />
                <div>
                    <h2>Ayush</h2>
                    <p>Your Money</p>
                </div>
                <button
                    className="icon-btn theme-toggle"
                    onClick={toggleTheme}
                    aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    title="Toggle theme"
                >
                    <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
                </button>
            </div>
            <ul className="menu">
                {pages.map((item) => (
                    <li key={item.id}>
                        <button
                            className={active === item.id ? 'active' : ''}
                            aria-current={active === item.id ? 'page' : undefined}
                            onClick={() => setActive(item.id)}
                        >
                            <i className={`fa-solid ${item.icon}`}></i>
                            <span>{item.title}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    )
}

export default Navigation
