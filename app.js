const products=[
{id:1,name:"Sculpted Ceramic Vase",category:"Home",price:899,cost:420,emoji:"🏺",bg:"#f2e7d9",tag:"BESTSELLER",desc:"A warm, minimal accent for any shelf."},
{id:2,name:"Everyday Wireless Buds",category:"Tech",price:1499,cost:780,emoji:"🎧",bg:"#e5eaf2",tag:"TRENDING",desc:"A compact everyday audio companion."},
{id:3,name:"Cloud Desk Lamp",category:"Home",price:1299,cost:650,emoji:"💡",bg:"#f5efcf",tag:"STAFF PICK",desc:"Soft light for your desk and bedside."},
{id:4,name:"Canvas Weekend Tote",category:"Lifestyle",price:699,cost:300,emoji:"👜",bg:"#e8e5d8",tag:"EASY GIFT",desc:"A simple carry-all for daily plans."},
{id:5,name:"Portable Mini Speaker",category:"Tech",price:1199,cost:610,emoji:"🔊",bg:"#e5e0f0",tag:"POPULAR",desc:"Bring your playlist along for the day."},
{id:6,name:"Insulated Travel Bottle",category:"Lifestyle",price:549,cost:240,emoji:"🥤",bg:"#dcebe1",tag:"EVERYDAY",desc:"A reusable bottle for busy routines."},
{id:7,name:"Soft Knit Cushion",category:"Home",price:799,cost:380,emoji:"🛋️",bg:"#f2dfd7",tag:"COZY PICK",desc:"Add a softer layer to your space."},
{id:8,name:"Foldable Phone Stand",category:"Tech",price:399,cost:150,emoji:"📱",bg:"#e2e9e8",tag:"BUDGET FIND",desc:"Keep your screen at a comfortable angle."}
];
const $=s=>document.querySelector(s);
const money=n=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);
let activeCategory="All",query="",sort="featured",cart={},toastTimer;
function toast(message){const el=$("#toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2600)}
function renderProducts(){let list=products.filter(p=>(activeCategory==="All"||p.category===activeCategory)&&(p.name+" "+p.category+" "+p.desc).toLowerCase().includes(query.toLowerCase()));if(sort==="low")list.sort((a,b)=>a.price-b.price);if(sort==="high")list.sort((a,b)=>b.price-a.price);const grid=$("#productGrid");if(!list.length){grid.innerHTML='<div class="empty-state"><strong>No products found</strong><p>Try another search or category.</p></div>';return}grid.innerHTML=list.map(p=>`<article class="product-card"><div class="product-image" style="background:${p.bg}"><span class="product-tag">${p.tag}</span><span class="emoji" aria-hidden="true">${p.emoji}</span></div><div class="product-info"><span class="product-category">${p.category}</span><h3>${p.name}</h3><div class="price-row"><span class="price">${money(p.price)}</span><button class="add-btn" data-add="${p.id}" aria-label="Add ${p.name} to bag">+ Add</button></div><div class="margin-note">Illustrative margin: ${money(p.price-p.cost)}*</div></div></article>`).join("");grid.querySelectorAll("[data-add]").forEach(btn=>btn.addEventListener("click",()=>addToCart(Number(btn.dataset.add))))}
function cartQty(){return Object.values(cart).reduce((a,b)=>a+b,0)}
function updateCartCount(){$("#cartCount").textContent=cartQty();$("#drawerCount").textContent=`(${cartQty()})`}
function addToCart(id){cart[id]=(cart[id]||0)+1;renderCart();toast("Added to your demo bag")}
function renderCart(){const items=$("#cartItems");const ids=Object.keys(cart).filter(id=>cart[id]>0);updateCartCount();if(!ids.length){items.innerHTML='<div class="empty-cart"><div>🛍️</div><h3>Your bag is taking a break</h3><p>Add a few products to see them here.<br>This is a demo cart, not a real order.</p><button class="primary" id="emptyBrowse">Explore products ↗</button></div>';$("#emptyBrowse").addEventListener("click",()=>{closeCart();$("#catalog").scrollIntoView({behavior:"smooth"})});$("#subtotal").textContent=money(0);return}let total=0;items.innerHTML=ids.map(id=>{const p=products.find(x=>x.id===Number(id));if(!p)return "";total+=p.price*cart[id];return `<div class="cart-row"><div class="cart-emoji" style="background:${p.bg}">${p.emoji}</div><div><h4>${p.name}</h4><small>${money(p.price)} each</small><div class="qty"><button data-qty="${id}" data-delta="-1" aria-label="Decrease quantity">−</button><span>${cart[id]}</span><button data-qty="${id}" data-delta="1" aria-label="Increase quantity">+</button></div></div><div><strong style="font-size:12px">${money(p.price*cart[id])}</strong><br><button class="remove" data-remove="${id}">Remove</button></div></div>`}).join("");$("#subtotal").textContent=money(total);items.querySelectorAll("[data-qty]").forEach(b=>b.addEventListener("click",()=>{const id=Number(b.dataset.qty);cart[id]=(cart[id]||0)+Number(b.dataset.delta);if(cart[id]<=0)delete cart[id];renderCart()}));items.querySelectorAll("[data-remove]").forEach(b=>b.addEventListener("click",()=>{delete cart[Number(b.dataset.remove)];renderCart();toast("Removed from your bag")}))}
function openCart(){$("#overlay").classList.add("show");$("#cartDrawer").classList.add("open");$("#cartDrawer").setAttribute("aria-hidden","false");document.body.style.overflow="hidden";$("#cartClose").focus()}
function closeCart(){$("#overlay").classList.remove("show");$("#cartDrawer").classList.remove("open");$("#cartDrawer").setAttribute("aria-hidden","true");document.body.style.overflow=""}
function openModal(){closeCart();$("#modalWrap").classList.add("show");document.body.style.overflow="hidden";$("#storeName").focus()}
function closeModal(){$("#modalWrap").classList.remove("show");document.body.style.overflow="";$("#formSuccess").hidden=true;$("#storeForm").hidden=false}
function startFlow(){openModal()}
$("#filters").addEventListener("click",e=>{const btn=e.target.closest("[data-category]");if(!btn)return;activeCategory=btn.dataset.category;$("#filters").querySelectorAll(".filter").forEach(b=>b.classList.toggle("active",b===btn));renderProducts()});
$("#searchInput").addEventListener("input",e=>{query=e.target.value;renderProducts()});$("#sortSelect").addEventListener("change",e=>{sort=e.target.value;renderProducts()});
$("#cartOpen").addEventListener("click",openCart);$("#cartClose").addEventListener("click",closeCart);$("#overlay").addEventListener("click",closeCart);
["#startBtn","#heroStart","#howStart","#ctaStart","#loginBtn"].forEach(sel=>$(sel).addEventListener("click",startFlow));
$("#modalClose").addEventListener("click",closeModal);$("#modalWrap").addEventListener("click",e=>{if(e.target===$("#modalWrap"))closeModal()});
$("#storeForm").addEventListener("submit",e=>{e.preventDefault();const name=$("#storeName").value.trim();const niche=$("#storeNiche").value;if(!name||!niche){toast("Please complete both fields.");return}$("#storeForm").hidden=true;const success=$("#formSuccess");success.hidden=false;success.innerHTML=`<strong>You're ready to explore, ${escapeHTML(name)}!</strong><br>Your demo workspace is set to <strong>${escapeHTML(niche)}</strong>. No real store, account, or payments have been created. Next: browse products and test the cart.`;$("#modalTitle").textContent="Your idea has a name.";$("#modalIntro").textContent="Your local demo setup is complete.";});
function escapeHTML(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
$("#checkoutBtn").addEventListener("click",async()=>{
  const ids=Object.keys(cart).filter(id=>cart[id]>0);
  if(!ids.length){toast("Your bag is empty.");return}
  const customerName=prompt("Demo order: enter customer name");
  if(customerName===null)return;
  const cleanName=customerName.trim();
  if(!cleanName){toast("Customer name is required.");return}
  const customerEmail=prompt("Enter an email for this demo order");
  if(customerEmail===null)return;
  const cleanEmail=customerEmail.trim();
  if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(cleanEmail)){toast("Please enter a valid email.");return}
  const button=$("#checkoutBtn");button.disabled=true;button.textContent="Saving demo order…";
  try{
    const response=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
      customer_name:cleanName,customer_email:cleanEmail,store_name:"DropFlow Demo",
      items:ids.map(id=>({product_id:Number(id),quantity:cart[id]}))
    })});
    const result=await response.json();
    if(!response.ok)throw new Error(result.error||"Could not save order");
    cart={};renderCart();closeCart();
    toast(`Demo order ${result.order.order_number} saved. No payment taken.`);
    alert(`Demo order saved!\\nOrder: ${result.order.order_number}\\nTotal: ₹${result.order.subtotal}\\nPayment: not connected — no money was charged.`);
  }catch(err){toast(err.message||"Backend not reachable. Start the server first.");}
  finally{button.disabled=false;button.textContent="Continue to demo checkout ↗";}
});
$("#menuBtn").addEventListener("click",()=>$("#mainNav")?$("#mainNav").classList.toggle("mobile-open"):document.querySelector(".topbar nav").classList.toggle("mobile-open"));
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeCart();closeModal();document.querySelector(".topbar nav").classList.remove("mobile-open")}});
renderProducts();renderCart();
