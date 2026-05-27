import productSheet from './assets/catalog-products.png'
import { hasSupabaseConfig, supabase } from './supabaseClient'

const cropBySlug = {
  'hmong-girl-dress-red': '0 0',
  'hmong-women-outfit-blue': '33.333% 0',
  'hmong-men-outfit-red': '66.666% 0',
  'hmong-kids-dress-pink': '100% 0',
  'modern-hmong-dress-purple': '0 100%',
  'hmong-new-style-green-pink': '33.333% 100%',
  'hmong-daily-wear-blue': '66.666% 100%',
  'hmong-embroidered-bag': '100% 100%',
}

function sortByOrder(items) {
  return [...(items ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
}

function dbCategoryToUi(category) {
  if (category === 'misc') return 'Misc'
  if (category === 'custom_order') return 'Custom Order'
  return 'Hmong Clothes'
}

function mapProduct(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: dbCategoryToUi(row.category),
    price: Number(row.price),
    status: row.status,
    crop: cropBySlug[row.slug] ?? '50% 50%',
    description: row.short_description,
    note: row.note,
    sizeLabel: row.size_label,
    genderLabel: row.gender_label,
    color: row.color,
    fabric: row.fabric,
    includes: sortByOrder(row.product_includes).map((item) => item.item),
    measurements: sortByOrder(row.product_measurements).map((item) => ({
      label: item.label,
      value: item.value,
    })),
    notes: sortByOrder(row.product_notes).map((item) => item.note),
    imageUrl: row.product_images?.find((image) => image.is_primary)?.image_url,
  }
}

export async function fetchProducts() {
  if (!hasSupabaseConfig) {
    throw new Error('Missing VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.')
  }

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_images (*),
      product_includes (*),
      product_measurements (*),
      product_notes (*)
    `)
    .in('status', ['available', 'reserved'])
    .order('created_at', { ascending: true })

  if (error) throw error
  return data.map(mapProduct)
}

export async function createReservation(product, form) {
  if (!hasSupabaseConfig) {
    throw new Error('Supabase is not configured.')
  }

  const { data: sessionData } = await supabase.auth.getSession()
  const userId = sessionData.session?.user?.id

  if (!userId) {
    throw new Error('Please log in or sign up before creating a ticket.')
  }

  const ticketNotes = [
    `Ticket type: ${form.requestType}`,
    form.bodyMeasurements ? `Measurements / adjustment: ${form.bodyMeasurements}` : '',
    form.note ? `Customer note: ${form.note}` : '',
  ].filter(Boolean).join('\n\n')

  const payload = {
    user_id: userId,
    product_id: product.id,
    product_name_snapshot: product.name,
    price_snapshot: product.price,
    customer_name: form.name,
    customer_email: form.email,
    customer_phone: form.phone,
    shipping_address: form.address,
    payment_method: form.paymentMethod,
    customer_note: ticketNotes,
    status: 'reserved',
  }

  const { error } = await supabase
    .from('reservations')
    .insert(payload)

  if (error) throw error
  return true
}

export async function getCurrentSession() {
  if (!hasSupabaseConfig) return null
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export function onAuthChange(callback) {
  if (!hasSupabaseConfig) return () => {}
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })
  return () => data.subscription.unsubscribe()
}

export async function signUpWithEmail(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  return data
}

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function fetchMyReservations() {
  if (!hasSupabaseConfig) return []

  const { data, error } = await supabase
    .from('reservations')
    .select(`
      id,
      order_number,
      product_id,
      product_name_snapshot,
      price_snapshot,
      payment_method,
      status,
      seller_note,
      created_at,
      paid_at,
      sold_at
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export { hasSupabaseConfig, productSheet }
