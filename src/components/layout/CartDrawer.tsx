import { ArrowRight, Repeat, ShoppingBag, Trash2, Truck, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import QuantityStepper from '@/components/ui/QuantityStepper';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { formatPrice, pluralizeItems } from '@/lib/format';

export default function CartDrawer() {
  const cart = useCart();
  const { settings } = useStore();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!cart.isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && cart.close();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [cart.isOpen, cart]);

  if (!cart.isOpen) return null;

  const progress = Math.min(100, (cart.subtotal / Math.max(1, cart.freeShippingThreshold)) * 100);

  const onApply = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim() || applying) return;
    setApplying(true);
    const ok = await cart.applyCode(code);
    setApplying(false);
    if (ok) {
      setCode('');
      setCodeError('');
    } else {
      setCodeError('Koda za popust ni veljavna ali je potekla.');
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-ink-950/50 backdrop-blur-[2px]" onClick={cart.close} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md animate-slide-in-right flex-col bg-white shadow-2xl" aria-label="Košarica">
        <div className="flex items-center justify-between border-b border-ink-100 px-6 py-5">
          <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-ink-900">Vaša košarica</h2>
          <button type="button" onClick={cart.close} aria-label="Zapri košarico" className="text-ink-900 transition-transform hover:rotate-90">
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        {cart.lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-mist-100">
              <ShoppingBag className="h-8 w-8 text-brand-600" strokeWidth={1.25} />
            </div>
            <p className="mt-6 text-lg font-normal text-ink-900">Vaša košarica je prazna</p>
            <p className="mt-2 text-sm text-ink-800/60">Odkrijte telefone, računalnike in drugo elektroniko vodilnih znamk.</p>
            <Link to="/trgovina" onClick={cart.close} className="btn-primary mt-8">
              Nakupuj zdaj
            </Link>
          </div>
        ) : (
          <>
            <div className="border-b border-ink-100 px-6 py-5">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-700 transition-all duration-700" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-3 flex items-center justify-center gap-2 text-center text-sm text-ink-800">
                <Truck className="h-4 w-4 text-brand-600" strokeWidth={1.5} />
                {cart.freeShippingLeft > 0 ? (
                  <span>
                    Še <strong className="font-medium">{formatPrice(cart.freeShippingLeft)}</strong> do brezplačne dostave
                  </span>
                ) : (
                  <span>
                    Čestitamo! Prislužili ste si <strong className="font-medium">brezplačno dostavo</strong>.
                  </span>
                )}
              </p>
            </div>

            <ul className="flex-1 divide-y divide-ink-100 overflow-y-auto px-6">
              {cart.lines.map((line) => (
                <li key={line.key} className="flex gap-4 py-5">
                  <Link to={`/izdelek/${line.slug}`} onClick={cart.close} className="h-24 w-20 shrink-0 overflow-hidden bg-mist-100">
                    <img src={line.product.images[0]} alt={line.product.name} className="h-full w-full object-cover" />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <Link to={`/izdelek/${line.slug}`} onClick={cart.close} className="text-sm font-normal text-ink-900 hover:text-brand-600">
                        {line.product.name}
                      </Link>
                      <button type="button" onClick={() => cart.remove(line.key)} aria-label="Odstrani" className="text-ink-300 transition-colors hover:text-red-600">
                        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-ink-800/60">{line.size}</p>
                    {line.subscribe && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-brand-700">
                        <Repeat className="h-3 w-3" /> Redna dostava (−{settings.subscribe_discount} %)
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <QuantityStepper size="sm" value={line.qty} onChange={(q) => cart.setQty(line.key, q)} />
                      <span className="text-sm font-normal text-ink-900">{formatPrice(line.total)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-ink-100 bg-mist-50 px-6 py-5">
              {cart.discountCode ? (
                <div className="mb-4 flex items-center justify-between bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  <span>
                    Koda <strong className="font-medium">{cart.discountCode}</strong> uporabljena
                  </span>
                  <button type="button" onClick={cart.removeCode} className="text-xs underline">
                    Odstrani
                  </button>
                </div>
              ) : (
                <form onSubmit={onApply} className="mb-4">
                  <div className="flex gap-2">
                    <input
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="KODA ZA POPUST"
                      className="input uppercase placeholder:tracking-[0.15em]"
                    />
                    <button type="submit" disabled={applying} className="disabled:opacity-50 bg-ink-900 px-5 text-xs font-medium uppercase tracking-[0.15em] text-white transition-colors hover:bg-brand-600">
                      Uporabi
                    </button>
                  </div>
                  {codeError && <p className="mt-2 text-xs text-red-600">{codeError}</p>}
                </form>
              )}
              <div className="space-y-1.5 text-sm">
                {cart.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Popust</span>
                    <span>−{formatPrice(cart.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium text-ink-900">
                  <span>Vmesni seštevek ({pluralizeItems(cart.count)})</span>
                  <span>{formatPrice(cart.subtotal - cart.discount)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  cart.close();
                  navigate('/blagajna');
                }}
                className="btn-primary group mt-5 w-full"
              >
                Na blagajno <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <p className="mt-3 text-center text-xs text-ink-800/50">DDV je vključen. Dostava se obračuna na blagajni.</p>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
