# Wireframes & User Flow Analysis
## KV Garage Wholesale Platform

---

## 1. User Flow Diagrams

### Primary B2B Buyer Journey
```
Landing Page → Pack Catalog → Pack Details → Manifest Review → Checkout → Order Confirmation
     ↓              ↓              ↓              ↓              ↓              ↓
  Trust Signals   Filter/Search   Buy/Reserve   Download CSV   Payment Choice   Email Receipt
     ↓              ↓              ↓              ↓              ↓              ↓
  Social Proof    Sort Options    View Manifest  PDF Export     Stripe Checkout  Manifest Access
```

### Secondary User Flows
```
Admin Login → Pack Management → Upload Manifest → Inventory Update → Order Management
     ↓              ↓              ↓              ↓              ↓
  Dashboard      Create Pack    CSV Upload     Real-time Sync   Track Orders
     ↓              ↓              ↓              ↓              ↓
  Analytics      Edit Details   Validation     Stock Updates    Customer Info
```

---

## 2. Detailed Wireframes

### 2.1 Homepage/Landing Page
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [KV GARAGE LOGO]                    [Shop] [About] [Contact] [Admin] [Cart] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                    WHOLESALE PACKS FOR RESELLERS                       │ │
│  │                                                                         │ │
│  │  "Curated tech packs with detailed manifests • Perfect for resellers"   │ │
│  │                                                                         │ │
│  │  [View Packs] [Download Catalog] [Contact: (616) 228-2244]             │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  TRUST SIGNALS                                                          │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │ │
│  │  │ ✓ Verified  │ │ 📞 Phone    │ │ 📧 Email    │ │ 💬 Chat     │       │ │
│  │  │ Suppliers   │ │ Support     │ │ Support     │ │ Support     │       │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘       │ │
│  │                                                                         │ │
│  │  "Average reseller flips inventory 2.5x in 30-60 days"                 │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  FEATURED PACKS                                                         │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                       │ │
│  │  │ STARTER     │ │ RESELLER    │ │ PRO         │                       │ │
│  │  │ PACK        │ │ PACK        │ │ PACK        │                       │ │
│  │  │             │ │             │ │             │                       │ │
│  │  │ $500        │ │ $1,000      │ │ $2,000      │                       │ │
│  │  │ ~250 units  │ │ ~500 units  │ │ ~1,000 units│                       │ │
│  │  │ Est. $1,200 │ │ Est. $3,000 │ │ Est. $5,000 │                       │ │
│  │  │             │ │             │ │             │                       │ │
│  │  │ [View Pack] │ │ [View Pack] │ │ [View Pack] │                       │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘                       │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Pack Catalog Page
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [KV GARAGE LOGO]                    [Shop] [About] [Contact] [Admin] [Cart] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  WHOLESALE PACKS                    [Filters ▼] [Sort ▼] [Search]       │ │
│  │                                                                         │ │
│  │  Showing 3 packs • "Perfect for resellers looking to maximize profits"  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                       │ │
│  │  │ STARTER     │ │ RESELLER    │ │ PRO         │                       │ │
│  │  │ PACK        │ │ PACK        │ │ PACK        │                       │ │
│  │  │             │ │             │ │             │                       │ │
│  │  │ [Pack Image]│ │ [Pack Image]│ │ [Pack Image]│                       │ │
│  │  │             │ │             │ │             │                       │ │
│  │  │ $500        │ │ $1,000      │ │ $2,000      │                       │ │
│  │  │ ~250 units  │ │ ~500 units  │ │ ~1,000 units│                       │ │
│  │  │ Est. $1,200 │ │ Est. $3,000 │ │ Est. $5,000 │                       │ │
│  │  │             │ │             │ │             │                       │ │
│  │  │ [Limited: 3]│ │ [Limited: 5]│ │ [Limited: 2]│                       │ │
│  │  │ left        │ │ left        │ │ left        │                       │ │
│  │  │             │ │             │ │             │                       │ │
│  │  │ [Buy Now]   │ │ [Buy Now]   │ │ [Buy Now]   │                       │ │
│  │  │ [Reserve]   │ │ [Reserve]   │ │ [Reserve]   │                       │ │
│  │  │ [Manifest]  │ │ [Manifest]  │ │ [Manifest]  │                       │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘                       │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  NEED A CUSTOM PACK?                                                    │ │
│  │  "Tell us what you're looking for and we'll create a custom pack"       │ │
│  │  [Request Custom Pack]                                                  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Pack Detail Page
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [KV GARAGE LOGO]                    [Shop] [About] [Contact] [Admin] [Cart] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [← Back to Packs]                                                          │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  ┌─────────────┐  STARTER PACK                                         │ │
│  │  │             │                                                       │ │
│  │  │   PACK      │  $500 • ~250 units • Est. resale value: $1,200        │ │
│  │  │   IMAGE     │                                                       │ │
│  │  │             │  Perfect for new resellers testing the market with     │ │
│  │  │             │  a small investment. Mix includes cases, cables,       │ │
│  │  │             │  screen protectors, and phone accessories.             │ │
│  │  └─────────────┘                                                       │ │
│  │                                                                         │ │
│  │  [Limited: 3 left] [Buy Now - $500] [Reserve with 50% - $250]          │ │
│  │                                                                         │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐ │ │
│  │  │  MANIFEST CONTENTS                                                  │ │ │
│  │  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                          │ │ │
│  │  │  │ 75  │ │ 100 │ │ 75  │ │ 25  │ │ 25  │                          │ │ │
│  │  │  │Cases│ │Cables│ │Pro- │ │Watch│ │Phone│                          │ │ │
│  │  │  │     │ │     │ │tect.│ │Acc. │ │Acc. │                          │ │ │
│  │  │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                          │ │ │
│  │  │                                                                     │ │ │
│  │  │  [View Full Manifest] [Download as CSV] [Download as PDF]           │ │ │
│  │  └─────────────────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  WHAT'S INCLUDED                                                        │ │
│  │  • 75 iPhone cases (various models) - Est. value: $450                 │ │
│  │  • 100 charging cables (USB-C, Lightning, Micro-USB) - Est. value: $300│ │
│  │  • 75 screen protectors (various sizes) - Est. value: $225             │ │
│  │  • 25 watch accessories - Est. value: $125                             │ │
│  │  • 25 phone accessories (PopSockets, stands) - Est. value: $100        │ │
│  │                                                                         │ │
│  │  Total estimated retail value: $1,200 • Your cost: $500 • Profit: $700 │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.4 Manifest Detail Modal
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  STARTER PACK MANIFEST                                    [Close ✕]    │ │
│  │                                                                         │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐ │ │
│  │  │  ITEM BREAKDOWN                                                     │ │ │
│  │  │  ┌─────────────────────────────────────────────────────────────────┐ │ │ │
│  │  │  │  SKU        │ Product Name           │ Qty │ Condition │ Est. $ │ │ │ │
│  │  │  │  ───────────┼────────────────────────┼─────┼───────────┼────────│ │ │ │
│  │  │  │  IP16CM-001 │ iPhone 16 Clear Case   │ 25  │ A         │ $150   │ │ │ │
│  │  │  │  IP16PM-002 │ iPhone 16 Pro Max Case │ 25  │ A         │ $175   │ │ │ │
│  │  │  │  IP16P-003  │ iPhone 16 Pro Case     │ 25  │ A         │ $125   │ │ │ │
│  │  │  │  USBC-004   │ USB-C Cable 6ft        │ 50  │ A         │ $150   │ │ │ │
│  │  │  │  LIGHT-005  │ Lightning Cable 6ft    │ 50  │ A         │ $150   │ │ │ │
│  │  │  │  SP-006     │ Screen Protector Set   │ 75  │ A         │ $225   │ │ │ │
│  │  │  │  WA-007     │ Watch Accessories      │ 25  │ A         │ $125   │ │ │ │
│  │  │  │  PA-008     │ Phone Accessories      │ 25  │ A         │ $100   │ │ │ │
│  │  │  └─────────────────────────────────────────────────────────────────┘ │ │ │
│  │  │                                                                     │ │ │
│  │  │  Total Items: 300 • Total Est. Value: $1,200 • Your Cost: $500     │ │ │
│  │  └─────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                         │ │
│  │  [Download as CSV] [Download as PDF] [Print Manifest]                   │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.5 Checkout Flow
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CHECKOUT - STARTER PACK                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  ORDER SUMMARY                                                          │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐ │ │
│  │  │  Starter Pack                                    $500.00            │ │ │
│  │  │  ~250 units • Est. resale value: $1,200                            │ │ │
│  │  │                                                                     │ │ │
│  │  │  [Limited: 3 left]                                                  │ │ │
│  │  └─────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                         │ │
│  │  PAYMENT OPTIONS                                                        │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐ │ │
│  │  │  ○ Full Payment - $500.00                                          │ │ │
│  │  │    Pay now and receive pack immediately                             │ │ │
│  │  │                                                                     │ │ │
│  │  │  ● Reserve with 50% Deposit - $250.00                              │ │ │
│  │  │    Pay $250 now, $250 when ready to ship                           │ │ │
│  │  └─────────────────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  BUSINESS INFORMATION                                                   │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐ │ │
│  │  │  Business Name: [________________]                                  │ │ │
│  │  │  Contact Name:  [________________]                                  │ │ │
│  │  │  Email:         [________________]                                  │ │ │
│  │  │  Phone:         [________________]                                  │ │ │
│  │  │  Address:       [________________]                                  │ │ │
│  │  │  City, State:   [________________]                                  │ │ │
│  │  │  ZIP:           [________________]                                  │ │ │
│  │  └─────────────────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  [Continue to Payment] [Back to Pack Details]                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.6 Admin Dashboard
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ADMIN DASHBOARD - KV GARAGE WHOLESALE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  DASHBOARD OVERVIEW                                                     │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │ │
│  │  │ Total Packs │ │ Active      │ │ Orders      │ │ Revenue     │       │ │
│  │  │ 12          │ │ Orders 8    │ │ Today 3     │ │ This Month  │       │ │
│  │  │             │ │             │ │             │ │ $15,000     │       │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘       │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  PACK MANAGEMENT                                                        │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐ │ │
│  │  │  Pack Name        │ Type    │ Price │ Stock │ Status │ Actions      │ │ │
│  │  │  ─────────────────┼─────────┼───────┼───────┼────────┼─────────────│ │ │
│  │  │  Starter Pack     │ Starter │ $500  │ 3     │ Active │ [Edit][View]│ │ │
│  │  │  Reseller Pack    │ Reseller│ $1000 │ 5     │ Active │ [Edit][View]│ │ │
│  │  │  Pro Pack         │ Pro     │ $2000 │ 2     │ Active │ [Edit][View]│ │ │
│  │  └─────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                         │ │
│  │  [Create New Pack] [Upload Manifest CSV] [Bulk Update Inventory]       │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  RECENT ORDERS                                                          │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐ │ │
│  │  │  Order # │ Customer        │ Pack        │ Amount │ Status │ Actions│ │ │
│  │  │  ────────┼─────────────────┼─────────────┼────────┼────────┼───────│ │ │
│  │  │  #1001   │ John's Tech     │ Starter     │ $500   │ Paid   │ [View]│ │ │
│  │  │  #1002   │ Mobile Plus     │ Reseller    │ $1000  │ Paid   │ [View]│ │ │
│  │  │  #1003   │ Tech Reseller   │ Pro         │ $2000  │ Deposit│ [View]│ │ │
│  │  └─────────────────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Mobile Responsive Considerations

### Mobile Pack Catalog (320px width)
```
┌─────────────────────────────────────┐
│ [☰] KV GARAGE    [🔍] [🛒] [👤]    │
├─────────────────────────────────────┤
│                                     │
│ WHOLESALE PACKS                     │
│ [Filters] [Sort]                    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ STARTER PACK                    │ │
│ │ [Image]                         │ │
│ │ $500 • ~250 units               │ │
│ │ Est. $1,200                     │ │
│ │ [Limited: 3 left]               │ │
│ │ [Buy] [Reserve] [Manifest]      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ RESELLER PACK                   │ │
│ │ [Image]                         │ │
│ │ $1,000 • ~500 units             │ │
│ │ Est. $3,000                     │ │
│ │ [Limited: 5 left]               │ │
│ │ [Buy] [Reserve] [Manifest]      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ PRO PACK                        │ │
│ │ [Image]                         │ │
│ │ $2,000 • ~1,000 units           │ │
│ │ Est. $5,000                     │ │
│ │ [Limited: 2 left]               │ │
│ │ [Buy] [Reserve] [Manifest]      │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Mobile Manifest View
```
┌─────────────────────────────────────┐
│ [←] Manifest Details        [✕]     │
├─────────────────────────────────────┤
│                                     │
│ STARTER PACK CONTENTS               │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 75 Cases                        │ │
│ │ 100 Cables                      │ │
│ │ 75 Protectors                   │ │
│ │ 25 Watch Acc.                   │ │
│ │ 25 Phone Acc.                   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Total: 300 items                   │
│ Est. Value: $1,200                 │
│ Your Cost: $500                    │
│                                     │
│ [Download CSV] [Download PDF]       │
│                                     │
│ [View Full Details]                │
└─────────────────────────────────────┘
```

---

## 4. User Experience Patterns

### Trust Building Elements
- **Social Proof**: "Average reseller flips 2.5x in 30-60 days"
- **Contact Visibility**: Phone number prominently displayed
- **Transparency**: Detailed manifests with exact contents
- **Professional Design**: Clean, business-focused interface
- **Supplier Info**: Background on sourcing and quality

### Conversion Optimization
- **Urgency**: "Limited - X left" badges
- **Value Proposition**: Clear profit estimates
- **Flexibility**: Multiple payment options
- **Convenience**: One-click manifest downloads
- **Support**: Multiple contact methods

### Mobile-First Considerations
- **Touch Targets**: Large buttons for mobile interaction
- **Simplified Navigation**: Streamlined menu structure
- **Quick Actions**: Easy access to key functions
- **Readable Text**: Appropriate font sizes for mobile
- **Fast Loading**: Optimized images and code

---

## 5. Technical Implementation Notes

### CSS Grid Layouts
```css
.pack-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  padding: 2rem;
}

@media (max-width: 768px) {
  .pack-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1rem;
  }
}
```

### JavaScript Interactions
- **Pack Selection**: Smooth transitions between pack views
- **Manifest Modal**: Overlay with smooth animations
- **Inventory Updates**: Real-time stock count updates
- **Form Validation**: Client-side validation for checkout
- **Mobile Menu**: Collapsible navigation for mobile

### Performance Considerations
- **Image Optimization**: WebP format with fallbacks
- **Lazy Loading**: Images load as user scrolls
- **Minimal JavaScript**: Only essential interactions
- **CDN Usage**: Fast delivery of static assets
- **Caching**: Browser caching for repeat visits

---

This wireframe and flow analysis provides the foundation for Phase 2 development, ensuring a user-centered approach to the wholesale platform transformation.
