import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ClipboardList,
  Ellipsis,
  FileText,
  HeartHandshake,
  Home as HomeIcon,
  Phone,
  Ruler,
  Scissors,
  Search,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Truck,
  UserRound,
} from 'lucide-react'
import hmongHeart from './assets/hmong_heart.png'
import {
  createReservation,
  fetchProducts,
  fetchMyReservations,
  getCurrentSession,
  hasSupabaseConfig,
  onAuthChange,
  productSheet,
  signInWithEmail,
  signOut,
  signUpWithEmail,
} from './shopData'
import './App.css'

const navigationItems = [
  { id: 'Home', icon: HomeIcon },
  { id: 'Hmong Clothes', icon: Shirt },
  { id: 'Miscs', icon: ShoppingBag },
  { id: 'Custom Order', icon: Scissors },
  { id: 'Contacts', icon: Phone },
  { id: 'Store Policy', icon: FileText },
  { id: 'Other', icon: Ellipsis },
]

const headerActions = [
  { id: 'Search', icon: Search, label: 'Search' },
  { id: 'Account', icon: UserRound, label: 'Account' },
  { id: 'Tickets', icon: ClipboardList, label: 'Tickets' },
]

const readyMadeSteps = [
  'Ticket created',
  'Waiting for payment verification',
  'Packed with USPS tracking',
  'Delivered',
  'Completed',
]

const customSteps = [
  'Ticket created',
  'Confirm measurements',
  'Crafting / adjustment',
  'Final photo approval',
  'Packed with USPS tracking',
  'Completed',
]

const trustItems = [
  { title: 'Quality Fabric', text: 'Made to last', icon: ShieldCheck },
  { title: 'Handmade', text: 'Made with care', icon: HeartHandshake },
  { title: 'Custom Order', text: 'Your style, your fit', icon: Ruler },
  { title: 'Worldwide Shipping', text: 'We ship to you', icon: Truck },
]

const policyItems = [
  {
    title: 'Refund Policy',
    text: 'Reserved items can be released before payment is confirmed. Paid custom orders are final sale once fabric cutting or embroidery work has started.',
  },
  {
    title: 'Shipping Policy',
    text: 'Ready-made items ship after payment confirmation. Shipping cost and delivery timing are confirmed with the seller before the order is marked sold.',
  },
  {
    title: 'Terms of Services',
    text: 'A reservation is a request to buy, not a completed sale. Items remain reserved until the seller confirms manual payment through PayPal, Venmo, or Cash App.',
  },
  {
    title: 'Privacy Policy',
    text: 'Customer contact and shipping details are used only to complete the reservation, payment confirmation, and delivery conversation.',
  },
]

const paymentMethods = ['PayPal', 'Venmo', 'Cash App']

function money(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

function App() {
  const [activeCategory, setActiveCategory] = useState('Home')
  const [products, setProducts] = useState([])
  const [detailSlug, setDetailSlug] = useState(() => {
    const productPrefix = '#product/'
    return window.location.hash.startsWith(productPrefix)
      ? window.location.hash.slice(productPrefix.length)
      : ''
  })
  const [reserveProduct, setReserveProduct] = useState(null)
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(hasSupabaseConfig)
  const [dataError, setDataError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [session, setSession] = useState(null)
  const [authMode, setAuthMode] = useState('login')
  const [authMessage, setAuthMessage] = useState('')
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
  })
  const [myTickets, setMyTickets] = useState([])
  const [ticketLoading, setTicketLoading] = useState(false)
  const [form, setForm] = useState({
    requestType: 'Ready-made item',
    name: '',
    email: '',
    phone: '',
    address: '',
    paymentMethod: 'PayPal',
    bodyMeasurements: '',
    note: '',
  })

  useEffect(() => {
    let alive = true

    async function loadShopData() {
      try {
        setLoading(true)
        const remoteProducts = await fetchProducts()

        if (!alive) return
        setProducts(remoteProducts)
        setDataError('')
      } catch (error) {
        if (!alive) return
        setDataError(error.message)
      } finally {
        if (alive) setLoading(false)
      }
    }

    loadShopData()

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    let alive = true

    async function loadSession() {
      try {
        const currentSession = await getCurrentSession()
        if (alive) setSession(currentSession)
      } catch (error) {
        if (alive) setAuthMessage(error.message)
      }
    }

    loadSession()
    const unsubscribe = onAuthChange((nextSession) => {
      setSession(nextSession)
    })

    return () => {
      alive = false
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    let alive = true

    async function loadTickets() {
      if (!session) {
        setMyTickets([])
        return
      }

      try {
        setTicketLoading(true)
        const tickets = await fetchMyReservations()
        if (alive) setMyTickets(tickets)
      } catch (error) {
        if (alive) setAuthMessage(error.message)
      } finally {
        if (alive) setTicketLoading(false)
      }
    }

    loadTickets()

    return () => {
      alive = false
    }
  }, [session])

  useEffect(() => {
    function syncDetailSlug() {
      const productPrefix = '#product/'
      setDetailSlug(
        window.location.hash.startsWith(productPrefix)
          ? window.location.hash.slice(productPrefix.length)
          : '',
      )
    }

    window.addEventListener('hashchange', syncDetailSlug)
    return () => window.removeEventListener('hashchange', syncDetailSlug)
  }, [])

  const reservedIds = useMemo(
    () => new Set(products.filter((product) => product.status === 'reserved').map((product) => product.id)),
    [products],
  )

  const detailProduct = useMemo(
    () => products.find((product) => product.slug === detailSlug),
    [detailSlug, products],
  )

  const visibleProducts = products.filter((product) => {
    const query = searchQuery.trim().toLowerCase()
    const searchableText = [
      product.name,
      product.category,
      product.description,
      product.note,
      product.sizeLabel,
      product.genderLabel,
      product.color,
      product.fabric,
      ...(product.includes ?? []),
      ...(product.notes ?? []),
      ...(product.measurements ?? []).flatMap((measurement) => [measurement.label, measurement.value]),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    if (activeCategory === 'Search') return query === '' ? true : searchableText.includes(query)
    if (activeCategory === 'Home') return true
    if (['Contacts', 'Store Policy', 'Other', 'Account', 'Tickets'].includes(activeCategory)) return false
    if (activeCategory === 'Custom Order') return product.category === 'Hmong Clothes'
    if (activeCategory === 'Miscs') return product.category === 'Misc'
    return product.category === activeCategory
  })

  const pageTitle = activeCategory === 'Home' ? 'Our Catalog' : activeCategory
  const showTrustRow = activeCategory === 'Hmong Clothes' || activeCategory === 'Miscs'

  function navigateToCategory(category) {
    setActiveCategory(category)
    setDetailSlug('')
    window.history.pushState(null, '', window.location.pathname + window.location.search)
  }

  function openProduct(product) {
    setDetailSlug(product.slug)
    window.history.pushState(null, '', `#product/${product.slug}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function closeProduct() {
    setDetailSlug('')
    window.history.pushState(null, '', window.location.pathname + window.location.search)
  }

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function updateAuthField(event) {
    const { name, value } = event.target
    setAuthForm((current) => ({ ...current, [name]: value }))
  }

  async function submitAuth(event) {
    event.preventDefault()
    setAuthMessage('')

    try {
      if (authMode === 'signup') {
        await signUpWithEmail(authForm.email, authForm.password)
        setAuthMessage('Account created. Check your email if Supabase requires confirmation, then log in.')
        setAuthMode('login')
      } else {
        await signInWithEmail(authForm.email, authForm.password)
        setAuthMessage('Logged in successfully.')
      }
      setAuthForm({ email: '', password: '' })
    } catch (error) {
      setAuthMessage(error.message)
    }
  }

  async function handleSignOut() {
    try {
      await signOut()
      setAuthMessage('Logged out.')
    } catch (error) {
      setAuthMessage(error.message)
    }
  }

  async function submitReserve(event) {
    event.preventDefault()
    if (!reserveProduct) return

    try {
      if (!session) {
        setNotice('Please log in or sign up before creating a ticket.')
        setReserveProduct(null)
        setActiveCategory('Account')
        return
      }

      await createReservation(reserveProduct, form)
      setProducts((current) =>
        current.map((product) =>
          product.id === reserveProduct.id ? { ...product, status: 'reserved' } : product,
        ),
      )
      setNotice(
        `${reserveProduct.name} ticket was created. The shop owner will verify payment and update the process status.`,
      )
      setReserveProduct(null)
      setForm({
        requestType: 'Ready-made item',
        name: '',
        email: '',
        phone: '',
        address: '',
        paymentMethod: 'PayPal',
        bodyMeasurements: '',
        note: '',
      })
    } catch (error) {
      setNotice(`Reservation failed: ${error.message}`)
    }
  }

  return (
    <main className="shop-shell">
      <aside className="sidebar" aria-label="Shop navigation">
        <div className="sidebar-main">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true">
              <img src={hmongHeart} alt="" />
            </div>
            <h1>Hmong Clothes 88</h1>
            <p>Tradition. Culture. Style.</p>
            <span className="divider" aria-hidden="true" />
          </div>

          <nav className="category-nav">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                className={activeCategory === item.id ? 'active' : ''}
                type="button"
                onClick={() => navigateToCategory(item.id)}
              >
                <span className="nav-icon" aria-hidden="true">
                  <item.icon size={19} strokeWidth={1.8} />
                </span>
                {item.id}
              </button>
            ))}
          </nav>

        </div>
      </aside>

      <section className="content">
        <div className="top-actions" aria-label="Search, account, and ticket tools">
          {headerActions.map((action) => (
            <button
              key={action.id}
              className={activeCategory === action.id ? 'active' : ''}
              type="button"
              onClick={() => navigateToCategory(action.id)}
              aria-label={action.label}
              title={action.label}
            >
              <action.icon size={21} strokeWidth={1.8} />
            </button>
          ))}
        </div>

        <header className="catalog-header">
          <p className="eyebrow">Manual payment boutique</p>
          <h2>{pageTitle}</h2>
          <span className="ornament" aria-hidden="true" />
          <p>Traditional designs. Modern quality.</p>
        </header>

        {notice && (
          <div className="notice" role="status">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice('')} aria-label="Dismiss notice">x</button>
          </div>
        )}

        {loading && (
          <div className="notice" role="status">
            <span>Loading Supabase catalog...</span>
          </div>
        )}

        {dataError && (
          <div className="notice warning" role="status">
            <span>Supabase could not load the catalog. {dataError}</span>
            <button type="button" onClick={() => setDataError('')} aria-label="Dismiss notice">x</button>
          </div>
        )}

        {detailProduct ? (
          <section className="product-detail" aria-label={`${detailProduct.name} details`}>
            <button className="back-link" type="button" onClick={closeProduct}>
              <ArrowLeft size={18} strokeWidth={1.8} aria-hidden="true" />
              Back to catalog
            </button>
            <div className="detail-layout">
              <div className="detail-image">
                <div
                  className="product-photo"
                  role="img"
                  aria-label={detailProduct.name}
                  style={{
                    backgroundImage: `url(${productSheet})`,
                    backgroundPosition: detailProduct.crop,
                  }}
                />
                {reservedIds.has(detailProduct.id) && <span className="status-pill">Reserved</span>}
              </div>
              <article className="detail-copy">
                <p className="eyebrow">{detailProduct.category}</p>
                <h3>{detailProduct.name}</h3>
                <p className="detail-price">{money(detailProduct.price)}</p>
                <p className="detail-description">{detailProduct.description}</p>

                <dl className="detail-facts">
                  {detailProduct.sizeLabel && (
                    <>
                      <dt>Size</dt>
                      <dd>{detailProduct.sizeLabel}</dd>
                    </>
                  )}
                  {detailProduct.genderLabel && (
                    <>
                      <dt>Fit</dt>
                      <dd>{detailProduct.genderLabel}</dd>
                    </>
                  )}
                  {detailProduct.color && (
                    <>
                      <dt>Color</dt>
                      <dd>{detailProduct.color}</dd>
                    </>
                  )}
                  {detailProduct.fabric && (
                    <>
                      <dt>Fabric</dt>
                      <dd>{detailProduct.fabric}</dd>
                    </>
                  )}
                </dl>

                {detailProduct.includes?.length > 0 && (
                  <section className="detail-section">
                    <h4>Included</h4>
                    <ul>
                      {detailProduct.includes.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </section>
                )}

                {detailProduct.measurements?.length > 0 && (
                  <section className="detail-section">
                    <h4>Measurements</h4>
                    <ul>
                      {detailProduct.measurements.map((measurement) => (
                        <li key={`${detailProduct.id}-${measurement.label}`}>
                          <strong>{measurement.label}:</strong> {measurement.value}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {detailProduct.notes?.length > 0 && (
                  <section className="detail-section">
                    <h4>Notes</h4>
                    <ul>
                      {detailProduct.notes.map((note) => <li key={note}>{note}</li>)}
                    </ul>
                  </section>
                )}

                <button
                  className="reserve-button"
                  type="button"
                  disabled={reservedIds.has(detailProduct.id)}
                  onClick={() => setReserveProduct(detailProduct)}
                >
                {reservedIds.has(detailProduct.id) ? 'Ticket Open' : 'Create Ticket'}
              </button>

              <section className="ticket-preview" aria-label="Ticket process preview">
                <h4>How this order moves</h4>
                <div className="process-list">
                  {(detailProduct.category === 'Custom Order' || detailProduct.notes?.some((note) => note.toLowerCase().includes('custom'))
                    ? customSteps
                    : readyMadeSteps
                  ).map((step, index) => (
                    <span key={step} className={index === 2 && step.includes('Crafting') ? 'craft-step' : ''}>
                      {index === 2 && step.includes('Crafting') && <Scissors size={15} strokeWidth={1.8} aria-hidden="true" />}
                      {step}
                    </span>
                  ))}
                </div>
              </section>
              </article>
            </div>
          </section>
        ) : (
          <>
        {(activeCategory === 'Contacts' || activeCategory === 'Custom Order') && (
          <section className="info-band">
            <h3>{activeCategory === 'Contacts' ? 'Contact the seller' : 'Custom order requests'}</h3>
            <p>
              Reserve requests are held until the seller confirms PayPal, Venmo, or Cash App payment.
              Add Supabase and EmailJS keys later to move the demo data into production services.
            </p>
          </section>
        )}

        {activeCategory === 'Search' && (
          <section className="search-panel" aria-label="Search catalog">
            <Search size={21} strokeWidth={1.8} aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search clothing, color, size, notes..."
              aria-label="Search catalog"
            />
          </section>
        )}

        {activeCategory === 'Account' && (
        <section className="account-access" aria-label="Account and ticket access">
            <article>
              <UserRound size={30} strokeWidth={1.6} aria-hidden="true" />
              <h3>{session ? 'Account' : authMode === 'signup' ? 'Create Account' : 'Login'}</h3>
              {session ? (
                <>
                  <p>Signed in as {session.user.email}.</p>
                  {session.user.app_metadata?.role === 'admin' && (
                    <p className="admin-badge">Admin account</p>
                  )}
                  <button className="submit-button" type="button" onClick={handleSignOut}>Log Out</button>
                </>
              ) : (
                <>
                  <p>Guests can sign up with email and password to create tickets and see item status.</p>
                  <form onSubmit={submitAuth}>
                    <label>
                      Email
                      <input
                        name="email"
                        type="email"
                        value={authForm.email}
                        onChange={updateAuthField}
                        required
                      />
                    </label>
                    <label>
                      Password
                      <input
                        name="password"
                        type="password"
                        value={authForm.password}
                        onChange={updateAuthField}
                        minLength="6"
                        required
                      />
                    </label>
                    <button className="submit-button" type="submit">
                      {authMode === 'signup' ? 'Sign Up' : 'Login'}
                    </button>
                  </form>
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => {
                      setAuthMessage('')
                      setAuthMode(authMode === 'signup' ? 'login' : 'signup')
                    }}
                  >
                    {authMode === 'signup' ? 'Already have an account? Login' : 'Need an account? Sign up'}
                  </button>
                </>
              )}
              {authMessage && <p className="help-note">{authMessage}</p>}
            </article>

            <article className="support-card">
              <Phone size={30} strokeWidth={1.6} aria-hidden="true" />
              <h3>Call or Text for Help</h3>
              <p>The easiest way to get help is to call or text the shop. We can explain payment, sizing, and custom questions.</p>
              <div className="contact-actions">
                <a href="tel:+15551234567">Call Shop</a>
                <a href="sms:+15551234567">Text Shop</a>
              </div>
            </article>

            <article>
              <ClipboardList size={30} strokeWidth={1.6} aria-hidden="true" />
              <h3>My Tickets</h3>
              {!session && <p>Log in to see your ticket status.</p>}
              {session && ticketLoading && <p>Loading tickets...</p>}
              {session && !ticketLoading && myTickets.length === 0 && <p>No tickets yet.</p>}
              {session && myTickets.length > 0 && (
                <div className="ticket-list">
                  {myTickets.map((ticket) => (
                    <article className="mini-ticket" key={ticket.id}>
                      <strong>{ticket.product_name_snapshot}</strong>
                      <span>{ticket.order_number} / {ticket.status}</span>
                      <span>{money(ticket.price_snapshot)} / {ticket.payment_method}</span>
                      {ticket.seller_note && <p>{ticket.seller_note}</p>}
                    </article>
                  ))}
                </div>
              )}
            </article>

            <article>
              <ShieldCheck size={30} strokeWidth={1.6} aria-hidden="true" />
              <h3>Admin Access</h3>
              <p>Admins use this same login, but admin permission must be added manually in Supabase. Guests cannot make themselves admin.</p>
              <p className="help-note">Set the user metadata role to admin in Supabase after creating the account.</p>
            </article>
          </section>
        )}

        {activeCategory === 'Tickets' && (
          <section className="ticket-board" aria-label="Order ticket process">
            {session && (
              <article>
                <ClipboardList size={30} strokeWidth={1.6} aria-hidden="true" />
                <h3>My Ticket Status</h3>
                {ticketLoading && <p>Loading tickets...</p>}
                {!ticketLoading && myTickets.length === 0 && <p>No tickets yet.</p>}
                {myTickets.length > 0 && (
                  <div className="ticket-list">
                    {myTickets.map((ticket) => (
                      <article className="mini-ticket" key={ticket.id}>
                        <strong>{ticket.product_name_snapshot}</strong>
                        <span>{ticket.order_number} / {ticket.status}</span>
                        <span>{money(ticket.price_snapshot)} / {ticket.payment_method}</span>
                        {ticket.seller_note && <p>{ticket.seller_note}</p>}
                      </article>
                    ))}
                  </div>
                )}
              </article>
            )}
            {!session && (
              <article>
                <UserRound size={30} strokeWidth={1.6} aria-hidden="true" />
                <h3>Login Required</h3>
                <p>Log in or sign up from the Account page to see ticket status.</p>
                <button className="submit-button" type="button" onClick={() => setActiveCategory('Account')}>
                  Go to Account
                </button>
              </article>
            )}
            <article>
              <ClipboardList size={30} strokeWidth={1.6} aria-hidden="true" />
              <h3>Ready-Made Ticket</h3>
              <p>For finished products. The customer creates a ticket, sends payment manually, and the shop owner verifies payment before packing and shipping.</p>
              <ol>
                {readyMadeSteps.map((step) => <li key={step}>{step}</li>)}
              </ol>
            </article>
            <article>
              <Scissors className="scissor-loop" size={30} strokeWidth={1.6} aria-hidden="true" />
              <h3>Custom / Adjustment Ticket</h3>
              <p>For custom work, sizing changes, or a smaller/larger fit. The ticket collects measurements and keeps the customer updated while the item is being made.</p>
              <ol>
                {customSteps.map((step) => <li key={step}>{step}</li>)}
              </ol>
            </article>
          </section>
        )}

        {activeCategory === 'Other' && (
          <section className="utility-panel">
            <Ellipsis size={30} strokeWidth={1.6} aria-hidden="true" />
            <h3>Other</h3>
            <p>Accessories, announcements, and extra shop information can be added here as the store grows.</p>
          </section>
        )}

        {activeCategory === 'Store Policy' && (
          <section className="policy-grid" aria-label="Store policies">
            {policyItems.map((policy) => (
              <article className="policy-card" key={policy.title}>
                <h3>{policy.title}</h3>
                <p>{policy.text}</p>
              </article>
            ))}
          </section>
        )}

        {visibleProducts.length > 0 && (
          <section className="catalog-grid" aria-label="Product catalog">
            {visibleProducts.map((product) => {
              const reserved = reservedIds.has(product.id)

              return (
                <article
                  className={reserved ? 'product-card reserved' : 'product-card'}
                  key={product.id}
                  role="button"
                  tabIndex="0"
                  onClick={() => openProduct(product)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      openProduct(product)
                    }
                  }}
                  aria-label={`View ${product.name} details`}
                >
                  <div className="product-image">
                    <div
                      className="product-photo"
                      role="img"
                      aria-label={product.name}
                      style={{
                        backgroundImage: `url(${productSheet})`,
                        backgroundPosition: product.crop,
                      }}
                    />
                    {reserved && <span className="status-pill">Reserved</span>}
                  </div>
                  <div className="product-copy">
                    <h3>{product.name}</h3>
                    <p>{money(product.price)}</p>
                    <span>{product.description}</span>
                  </div>
                </article>
              )
            })}
          </section>
        )}

        {showTrustRow && (
          <section className="trust-row" aria-label="Shop benefits">
            {trustItems.map((item) => (
              <div key={item.title}>
                <item.icon size={34} strokeWidth={1.5} aria-hidden="true" />
                <span>
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </span>
              </div>
            ))}
          </section>
        )}
          </>
        )}
      </section>

      {reserveProduct && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setReserveProduct(null)}>
          <section
            className="reserve-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reserve-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="close-button" type="button" onClick={() => setReserveProduct(null)} aria-label="Close">
              x
            </button>
            <p className="eyebrow">Order Ticket</p>
            <h3 id="reserve-title">{reserveProduct.name}</h3>
            <p className="modal-price">{money(reserveProduct.price)}</p>

            <form onSubmit={submitReserve}>
              <label>
                Ticket type
                <select name="requestType" value={form.requestType} onChange={updateField}>
                  <option>Ready-made item</option>
                  <option>Custom or size adjustment</option>
                </select>
              </label>
              <label>
                Full name
                <input name="name" value={form.name} onChange={updateField} required />
              </label>
              <label>
                Email
                <input name="email" type="email" value={form.email} onChange={updateField} required />
              </label>
              <label>
                Phone
                <input name="phone" value={form.phone} onChange={updateField} required />
              </label>
              <label>
                Shipping address
                <textarea name="address" value={form.address} onChange={updateField} rows="3" required />
              </label>
              <label>
                Payment method
                <select name="paymentMethod" value={form.paymentMethod} onChange={updateField}>
                  {paymentMethods.map((method) => <option key={method}>{method}</option>)}
                </select>
              </label>
              <label>
                Measurements or adjustment notes
                <textarea
                  name="bodyMeasurements"
                  value={form.bodyMeasurements}
                  onChange={updateField}
                  rows="3"
                  placeholder="Chest, waist, length, height, or what needs to be adjusted"
                />
              </label>
              <label>
                Extra notes
                <textarea name="note" value={form.note} onChange={updateField} rows="2" />
              </label>
              <button type="submit" className="submit-button">Create Ticket</button>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}

export default App
