import sys

def modify_my_orders():
    with open('wasel-main/src/pages/MyOrders.jsx', 'r', encoding='utf-8') as f:
        text = f.read()
    
    # 1. Add filter state
    text = text.replace(
        "const [orders, setOrders] = useState([]);",
        "const [orders, setOrders] = useState([]);\n  const [activeTab, setActiveTab] = useState('all');"
    )

    # 2. Add Tabs UI
    tabs_ui = '''<div className="flex bg-white shadow-sm mb-4">
        <button 
          onClick={() => setActiveTab('all')} 
          className={lex-1 py-3 text-sm font-bold }
        >
          طلباتي
        </button>
        <button 
          onClick={() => setActiveTab('shared')} 
          className={lex-1 py-3 text-sm font-bold }
        >
          سلال مشتركة
        </button>
      </div>
      
      {orders.length === 0 ?'''
      
    text = text.replace('{orders.length === 0 ?', tabs_ui)

    # 3. Apply filter when rendering orders map
    text = text.replace(
        'orders.map((order) =>',
        'orders.filter(order => activeTab === \\'shared\\' ? order.is_shared_cart : !order.is_shared_cart).map((order) =>'
    )
    
    with open('wasel-main/src/pages/MyOrders.jsx', 'w', encoding='utf-8') as f:
        f.write(text)

modify_my_orders()
