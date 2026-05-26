import { useEffect, useMemo, useState } from 'react'
import {
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
  ShoppingCart,
  Truck,
  UserRound,
} from 'lucide-react'
import hmongHeart from './assets/hmong_heart.png'
import borderPattern from './assets/border.png'
import {
  createReservation,
  fetchProducts,
  hasSupabaseConfig,
  productSheet,
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
  { id: 'Login', icon: UserRound, label: 'Login' },
  { id: 'Cart', icon: ShoppingCart, label: 'Cart' },
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
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(hasSupabaseConfig)
  const [dataError, setDataError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    paymentMethod: 'PayPal',
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

  const reservedIds = useMemo(
    () => new Set(products.filter((product) => product.status === 'reserved').map((product) => product.id)),
    [products],
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
    if (['Contacts', 'Store Policy', 'Other', 'Login', 'Cart'].includes(activeCategory)) return false
    if (activeCategory === 'Custom Order') return product.category === 'Hmong Clothes'
    if (activeCategory === 'Miscs') return product.category === 'Misc'
    return product.category === activeCategory
  })

  const pageTitle = activeCategory === 'Home' ? 'Our Catalog' : activeCategory
  const showTrustRow = activeCategory === 'Hmong Clothes' || activeCategory === 'Miscs'

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function submitReserve(event) {
    event.preventDefault()
    if (!selectedProduct) return

    try {
      await createReservation(selectedProduct, form)
      setProducts((current) =>
        current.map((product) =>
          product.id === selectedProduct.id ? { ...product, status: 'reserved' } : product,
        ),
      )
      setNotice(
        `${selectedProduct.name} is reserved. Seller and customer confirmation emails are ready to send through EmailJS or FormSubmit.`,
      )
      setSelectedProduct(null)
      setForm({
        name: '',
        email: '',
        phone: '',
        address: '',
        paymentMethod: 'PayPal',
        note: '',
      })
    } catch (error) {
      setNotice(`Reservation failed: ${error.message}`)
    }
  }

  return (
    <main className="shop-shell">
      <aside className="sidebar" aria-label="Shop navigation">
        <div className="woven-strip" aria-hidden="true">
          <img src={borderPattern} alt="" />
        </div>
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
                onClick={() => setActiveCategory(item.id)}
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
        <div className="top-actions" aria-label="Account and shopping tools">
          {headerActions.map((action) => (
            <button
              key={action.id}
              className={activeCategory === action.id ? 'active' : ''}
              type="button"
              onClick={() => setActiveCategory(action.id)}
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

        {activeCategory === 'Login' && (
          <section className="utility-panel">
            <UserRound size={30} strokeWidth={1.6} aria-hidden="true" />
            <h3>Login</h3>
            <p>Customer and seller accounts can be connected here later with Supabase Auth.</p>
          </section>
        )}

        {activeCategory === 'Cart' && (
          <section className="utility-panel">
            <ShoppingCart size={30} strokeWidth={1.6} aria-hidden="true" />
            <h3>Cart</h3>
            <p>This shop uses reserve requests instead of instant checkout. Reserved items wait for manual PayPal, Venmo, or Cash App confirmation.</p>
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
                <article className={reserved ? 'product-card reserved' : 'product-card'} key={product.id}>
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
                    <ul className="product-notes">
                      {product.includes?.length > 0 && (
                        <li><strong>Outfit includes:</strong> {product.includes.join(', ')}</li>
                      )}
                      {product.sizeLabel && <li><strong>Size:</strong> {product.sizeLabel}</li>}
                      {product.measurements?.slice(0, 3).map((measurement) => (
                        <li key={`${product.id}-${measurement.label}`}>
                          <strong>{measurement.label}:</strong> {measurement.value}
                        </li>
                      ))}
                      {product.notes?.slice(0, 1).map((note) => (
                        <li key={`${product.id}-${note}`}>{note}</li>
                      ))}
                    </ul>
                  </div>
                  <button
                    className="reserve-button"
                    type="button"
                    disabled={reserved}
                    onClick={() => setSelectedProduct(product)}
                  >
                    {reserved ? 'Awaiting Payment' : 'Reserve / Buy Request'}
                  </button>
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
      </section>

      {selectedProduct && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelectedProduct(null)}>
          <section
            className="reserve-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reserve-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="close-button" type="button" onClick={() => setSelectedProduct(null)} aria-label="Close">
              x
            </button>
            <p className="eyebrow">Reserve Request</p>
            <h3 id="reserve-title">{selectedProduct.name}</h3>
            <p className="modal-price">{money(selectedProduct.price)}</p>

            <form onSubmit={submitReserve}>
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
                Notes
                <textarea name="note" value={form.note} onChange={updateField} rows="2" />
              </label>
              <button type="submit" className="submit-button">Reserve Item</button>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}

export default App
