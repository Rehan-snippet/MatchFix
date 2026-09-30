import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import {
  Menu,
  User,
  Globe,
  Trophy,
  ShoppingBag,
  ShoppingCart,
  ShieldCheck,
  Shield,
  LogOut,
  Calendar,
  Package,
  Heart,
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isTurfsPage = location.pathname === "/turfs";

  function handleLogout() {
    logout();
    setMenuOpen(false);
    navigate("/");
  }

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-200">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-2 sm:gap-4 flex-nowrap">
            {/* 1. Left: OG Brand Logo with green Fix */}
            <Link
              to="/"
              className="flex items-center gap-2 flex-shrink-0 group"
              id="brand-logo"
            >
              <span className="font-black text-2xl sm:text-3xl tracking-tight text-neutral-900 select-none">
                Match<span className="text-[#16a34a]">Fix</span>!
              </span>
            </Link>

            {/* 3. Right: Host actions & User profile capsule */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-auto">
              {/* Organizer Studio link */}
              {user?.roles?.includes("organizer") && (
                <Link
                  to="/organizer"
                  className="hidden md:inline-flex text-xs font-semibold text-neutral-800 hover:bg-neutral-100 px-3 py-2 rounded-full transition whitespace-nowrap"
                >
                  Organizer Studio
                </Link>
              )}

              {/* Seller Dashboard link */}
              {user?.roles?.includes("seller") && (
                <Link
                  to="/seller"
                  className="hidden md:inline-flex text-xs font-semibold text-neutral-800 hover:bg-neutral-100 px-3 py-2 rounded-full transition whitespace-nowrap"
                >
                  Seller Dashboard
                </Link>
              )}

              {/* Host your turf link (for users who are neither organizer nor seller) */}
              {!user?.roles?.includes("organizer") && !user?.roles?.includes("seller") && (
                <Link
                  to="/turfs"
                  className="hidden md:inline-flex text-xs font-semibold text-neutral-800 hover:bg-neutral-100 px-3 py-2 rounded-full transition whitespace-nowrap"
                >
                  Host your turf
                </Link>
              )}

              {/* Marketplace link */}
              <Link
                to="/marketplace"
                className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 px-3 py-2 rounded-full transition whitespace-nowrap"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-neutral-600" />
                <span>Gear Shop</span>
              </Link>

              {/* Admin Console Pill */}
              {user?.is_admin && (
                <Link
                  to="/admin"
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-full transition shadow-2xs whitespace-nowrap"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-600" />
                  <span>Admin</span>
                </Link>
              )}

              {/* Language / Region pill */}
              <button
                type="button"
                className="hidden sm:flex p-2.5 text-neutral-700 hover:bg-neutral-100 rounded-full transition"
                title="Dhaka, Bangladesh · BDT (৳)"
              >
                <Globe className="w-4 h-4" />
              </button>

              {/* Shopping Cart Pill */}
              <Link
                to="/cart"
                className="relative p-2.5 text-neutral-700 hover:bg-neutral-100 rounded-full transition flex items-center justify-center cursor-pointer"
                title="Shopping Cart"
              >
                <ShoppingCart className="w-5 h-5 text-neutral-700" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 bg-[#16a34a] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>

              {/* User Dropdown Capsule */}
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className={`flex items-center gap-3 p-1.5 pl-3 border border-neutral-300 hover:shadow-md rounded-full transition cursor-pointer ${
                    menuOpen ? "shadow-md border-neutral-900" : ""
                  }`}
                >
                  <Menu className="w-4 h-4 text-neutral-700 stroke-[2.2]" />
                  <div className="w-7 h-7 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs uppercase overflow-hidden">
                    {user ? (
                      user.name.slice(0, 1)
                    ) : (
                      <User className="w-4 h-4 text-neutral-200" />
                    )}
                  </div>
                </button>

                {/* User Dropdown Menu */}
                {menuOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-neutral-200 py-2 z-50 text-sm animate-in fade-in zoom-in-95 duration-100">
                    {user ? (
                      <>
                        <div className="px-4 py-3 border-b border-neutral-100">
                          <p className="font-bold text-neutral-900 truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-neutral-500 truncate">
                            {user.email}
                          </p>
                        </div>

                        {user.is_admin && (
                          <div className="px-3 py-1.5 bg-amber-50/80 border-b border-amber-100 flex items-center justify-between">
                            <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                              <Shield className="w-3 h-3 text-amber-600" /> Super Admin
                            </span>
                            <Link
                              to="/admin"
                              onClick={() => setMenuOpen(false)}
                              className="text-[10px] font-extrabold text-amber-800 hover:text-amber-950 uppercase tracking-wider"
                            >
                              Console &rarr;
                            </Link>
                          </div>
                        )}

                        <div className="py-1">
                          <Link
                            to="/my-bookings"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-neutral-100 font-medium text-neutral-800"
                          >
                            <Calendar className="w-4 h-4 text-neutral-500" />
                            <span>My Bookings</span>
                          </Link>
                          <Link
                            to="/my-orders"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-neutral-100 font-medium text-neutral-800"
                          >
                            <Package className="w-4 h-4 text-neutral-500" />
                            <span>My Orders</span>
                          </Link>
                          <Link
                            to="/cart"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center justify-between px-4 py-2.5 hover:bg-neutral-100 font-medium text-neutral-800"
                          >
                            <div className="flex items-center gap-2.5">
                              <ShoppingCart className="w-4 h-4 text-neutral-500" />
                              <span>Shopping Cart</span>
                            </div>
                            {cartCount > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#16a34a] border border-emerald-200 text-[10px] font-black">
                                {cartCount}
                              </span>
                            )}
                          </Link>
                          <Link
                            to="/turfs"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-neutral-100 font-medium text-neutral-800"
                          >
                            <Trophy className="w-4 h-4 text-neutral-500" />
                            <span>Explore Turfs</span>
                          </Link>
                          <Link
                            to="/marketplace"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-neutral-100 font-medium text-neutral-800"
                          >
                            <ShoppingBag className="w-4 h-4 text-neutral-500" />
                            <span>Gear Marketplace</span>
                          </Link>
                          <Link
                            to="/wishlist"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-neutral-100 font-medium text-neutral-800"
                          >
                            <Heart className="w-4 h-4 text-neutral-500" />
                            <span>My Wishlist</span>
                          </Link>
                        </div>

                        <hr className="my-1 border-neutral-100" />

                        <div className="py-1">
                          {user.is_admin && (
                            <Link
                              to="/admin"
                              onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 hover:bg-amber-50 text-xs font-bold text-amber-800"
                            >
                              <Shield className="w-4 h-4 text-amber-600" />
                              <span>Admin Operations</span>
                            </Link>
                          )}
                          {user.roles?.includes("organizer") && (
                            <Link
                              to="/organizer"
                              onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 hover:bg-neutral-100 text-xs text-neutral-700"
                            >
                              <ShieldCheck className="w-4 h-4 text-[#16a34a]" />
                              <span>Organizer Dashboard</span>
                            </Link>
                          )}
                          {user.roles?.includes("seller") && (
                            <Link
                              to="/seller"
                              onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 hover:bg-neutral-100 text-xs text-neutral-700"
                            >
                              <ShoppingBag className="w-4 h-4 text-neutral-700" />
                              <span>Seller Dashboard</span>
                            </Link>
                          )}
                          <Link
                            to="/profile"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 hover:bg-neutral-100 text-xs text-neutral-700"
                          >
                            <User className="w-4 h-4 text-neutral-500" />
                            <span>Account & Roles</span>
                          </Link>
                        </div>

                        <hr className="my-1 border-neutral-100" />

                        <button
                          onClick={handleLogout}
                          className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 font-semibold cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Log out</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="py-1">
                          <Link
                            to="/login"
                            onClick={() => setMenuOpen(false)}
                            className="block px-4 py-2.5 font-bold text-neutral-900 hover:bg-neutral-100"
                          >
                            Log in
                          </Link>
                          <Link
                            to="/register"
                            onClick={() => setMenuOpen(false)}
                            className="block px-4 py-2 text-neutral-700 hover:bg-neutral-100"
                          >
                            Sign up
                          </Link>
                        </div>

                        <hr className="my-1 border-neutral-100" />

                        <div className="py-1">
                          <Link
                            to="/turfs"
                            onClick={() => setMenuOpen(false)}
                            className="block px-4 py-2 text-xs text-neutral-700 hover:bg-neutral-100"
                          >
                            Find a Turf
                          </Link>
                          <Link
                            to="/marketplace"
                            onClick={() => setMenuOpen(false)}
                            className="block px-4 py-2 text-xs text-neutral-700 hover:bg-neutral-100"
                          >
                            Shop Football Gear
                          </Link>
                          <Link
                            to="/cart"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center justify-between px-4 py-2 text-xs text-neutral-700 hover:bg-neutral-100"
                          >
                            <span>Shopping Cart</span>
                            {cartCount > 0 && (
                              <span className="px-1.5 py-0.2 rounded-full bg-emerald-50 text-[#16a34a] border border-emerald-200 text-[10px] font-black">
                                {cartCount}
                              </span>
                            )}
                          </Link>
                          <Link
                            to="/login"
                            onClick={() => setMenuOpen(false)}
                            className="block px-4 py-2 text-xs text-neutral-700 hover:bg-neutral-100"
                          >
                            Host your turf
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
