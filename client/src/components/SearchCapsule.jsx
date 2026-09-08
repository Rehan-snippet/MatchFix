import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, MapPin, Calendar, Users, X, ChevronRight } from "lucide-react";
import api from "../api/client";

export default function AirbnbSearchCapsule({ isHero = false }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [areas, setAreas] = useState([]);
  const [activeTab, setActiveTab] = useState(null); // 'where' | 'when' | 'format' | null
  const [selectedArea, setSelectedArea] = useState(
    searchParams.get("area_id") || "",
  );
  const [selectedDate, setSelectedDate] = useState(
    searchParams.get("date") || "",
  );
  const [selectedFormat, setSelectedFormat] = useState(
    searchParams.get("side_type") || "",
  );
  const [searchKeyword, setSearchKeyword] = useState(
    searchParams.get("keyword") || "",
  );

  const containerRef = useRef(null);

  useEffect(() => {
    api
      .get("/areas")
      .then((res) => setAreas(res.data))
      .catch(() => {});
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setActiveTab(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedAreaObj = areas.find(
    (a) => String(a.area_id) === String(selectedArea),
  );

  function handleSearch(e) {
    if (e) e.stopPropagation();
    const params = new URLSearchParams();
    if (selectedArea) params.set("area_id", selectedArea);
    if (searchKeyword.trim()) params.set("keyword", searchKeyword.trim());
    if (selectedDate) params.set("date", selectedDate);
    if (selectedFormat) params.set("side_type", selectedFormat);

    setActiveTab(null);
    navigate(`/turfs?${params.toString()}`);
  }

  function handleQuickDate(daysAhead) {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    setSelectedDate(d.toISOString().slice(0, 10));
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      {/* Search Capsule Bar */}
      <div
        className={`flex items-center bg-white rounded-full border transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md ${
          activeTab
            ? "bg-neutral-100/90 border-neutral-300 ring-2 ring-neutral-200"
            : "border-neutral-200"
        } ${isHero ? "py-2 px-3 shadow-md" : "py-1.5 px-2.5"}`}
      >
        {/* Destination / Where */}
        <div
          onClick={() => setActiveTab(activeTab === "where" ? null : "where")}
          className={`flex-1 px-4 py-1.5 rounded-full text-left transition-colors ${
            activeTab === "where"
              ? "bg-white shadow-md"
              : "hover:bg-neutral-100/80"
          }`}
        >
          <div className="text-[11px] font-bold tracking-wider text-neutral-800 uppercase">
            Where
          </div>
          <div className="text-sm font-medium text-neutral-600 truncate">
            {selectedAreaObj
              ? `${selectedAreaObj.name}`
              : searchKeyword || "Search Dhaka destinations"}
          </div>
        </div>

        <div className="w-[1px] h-6 bg-neutral-200" />

        {/* When / Date */}
        <div
          onClick={() => setActiveTab(activeTab === "when" ? null : "when")}
          className={`flex-1 px-4 py-1.5 rounded-full text-left transition-colors ${
            activeTab === "when"
              ? "bg-white shadow-md"
              : "hover:bg-neutral-100/80"
          }`}
        >
          <div className="text-[11px] font-bold tracking-wider text-neutral-800 uppercase">
            When
          </div>
          <div className="text-sm font-medium text-neutral-600 truncate">
            {selectedDate ? selectedDate : "Any match day"}
          </div>
        </div>

        <div className="w-[1px] h-6 bg-neutral-200" />

        {/* Format / Who */}
        <div
          onClick={() => setActiveTab(activeTab === "format" ? null : "format")}
          className={`flex-1 px-4 py-1.5 rounded-full text-left transition-colors ${
            activeTab === "format"
              ? "bg-white shadow-md"
              : "hover:bg-neutral-100/80"
          }`}
        >
          <div className="text-[11px] font-bold tracking-wider text-neutral-800 uppercase">
            Format
          </div>
          <div className="text-sm font-medium text-neutral-600 truncate">
            {selectedFormat ? `${selectedFormat} match` : "5v5, 7v7, 11v11"}
          </div>
        </div>

        {/* Signature Circular Green Search Button */}
        <button
          onClick={handleSearch}
          className="ml-2 flex items-center justify-center bg-[#16a34a] hover:bg-[#15803d] text-white p-2.5 sm:px-4 sm:py-2.5 rounded-full font-semibold text-sm transition-transform active:scale-95 shadow-sm gap-1.5 flex-shrink-0 cursor-pointer"
          title="Search Turfs"
        >
          <Search className="w-4 h-4 text-white stroke-[2.5]" />
          {isHero && (
            <span className="hidden sm:inline text-white font-medium text-sm">
              Search
            </span>
          )}
        </button>
      </div>

      {/* Expanded Interactive Dropdown Popup */}
      {activeTab && (
        <div className="absolute top-full left-0 right-0 mt-3 p-5 bg-white rounded-3xl shadow-2xl border border-neutral-200 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex justify-between items-center pb-3 mb-4 border-b border-neutral-100">
            <h4 className="font-semibold text-neutral-900 text-sm">
              {activeTab === "where" &&
                "Search by Area or Neighborhood in Dhaka"}
              {activeTab === "when" && "Select Match Date"}
              {activeTab === "format" && "Select Pitch Format & Squad Size"}
            </h4>
            <button
              onClick={() => setActiveTab(null)}
              className="p-1 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* TAB 1: WHERE */}
          {activeTab === "where" && (
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Type venue name or location (e.g., Banani, Mirpur, Greenline)"
                  value={searchKeyword}
                  onChange={(e) => {
                    setSearchKeyword(e.target.value);
                    if (selectedArea) setSelectedArea("");
                  }}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#16a34a]"
                  autoFocus
                />
              </div>

              <div>
                <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                  Popular Dhaka Neighborhoods
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      setSelectedArea("");
                      setSearchKeyword("");
                      setActiveTab("when");
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs transition ${
                      !selectedArea && !searchKeyword
                        ? "border-neutral-900 bg-neutral-900 text-white font-semibold"
                        : "border-neutral-200 hover:border-neutral-400 text-neutral-800"
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>All of Dhaka</span>
                  </button>
                  {areas.map((a) => {
                    const isSelected =
                      String(selectedArea) === String(a.area_id);
                    return (
                      <button
                        key={a.area_id}
                        onClick={() => {
                          setSelectedArea(a.area_id);
                          setSearchKeyword("");
                          setActiveTab("when");
                        }}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs transition ${
                          isSelected
                            ? "border-neutral-900 bg-neutral-900 text-white font-semibold"
                            : "border-neutral-200 hover:border-neutral-400 text-neutral-800"
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{a.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WHEN */}
          {activeTab === "when" && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleQuickDate(0);
                    setActiveTab("format");
                  }}
                  className={`px-3 py-1.5 text-xs rounded-full border transition ${
                    selectedDate === todayStr
                      ? "border-[#16a34a] bg-emerald-50 text-[#16a34a] font-semibold"
                      : "border-neutral-200 hover:border-neutral-400 text-neutral-800"
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleQuickDate(1);
                    setActiveTab("format");
                  }}
                  className="px-3 py-1.5 text-xs rounded-full border border-neutral-200 hover:border-neutral-400 text-neutral-800 transition"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleQuickDate(3);
                    setActiveTab("format");
                  }}
                  className="px-3 py-1.5 text-xs rounded-full border border-neutral-200 hover:border-neutral-400 text-neutral-800 transition"
                >
                  This Weekend
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate("")}
                  className="px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-900 ml-auto"
                >
                  Reset date
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                  Pick a match calendar date
                </label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-neutral-500" />
                  <input
                    type="date"
                    value={selectedDate}
                    min={todayStr}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setActiveTab("format");
                    }}
                    className="px-3 py-2 text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#16a34a]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FORMAT */}
          {activeTab === "format" && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  {
                    key: "5v5",
                    label: "5-a-side",
                    sub: "Fast-paced cage turf",
                  },
                  {
                    key: "7v7",
                    label: "7-a-side",
                    sub: "Standard medium pitch",
                  },
                  {
                    key: "11v11",
                    label: "11-a-side",
                    sub: "Full regulation size",
                  },
                ].map((fmt) => (
                  <button
                    key={fmt.key}
                    type="button"
                    onClick={() =>
                      setSelectedFormat(
                        selectedFormat === fmt.key ? "" : fmt.key,
                      )
                    }
                    className={`p-3 rounded-2xl border text-left transition ${
                      selectedFormat === fmt.key
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-200 hover:border-neutral-400 text-neutral-800"
                    }`}
                  >
                    <div className="font-bold text-sm">{fmt.label}</div>
                    <div
                      className={`text-[11px] mt-0.5 ${
                        selectedFormat === fmt.key
                          ? "text-neutral-300"
                          : "text-neutral-500"
                      }`}
                    >
                      {fmt.sub}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Action Footer */}
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => {
                setSelectedArea("");
                setSelectedDate("");
                setSelectedFormat("");
                setSearchKeyword("");
              }}
              className="text-xs font-semibold text-neutral-600 underline hover:text-neutral-900"
            >
              Clear all
            </button>
            <button
              type="button"
              onClick={handleSearch}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold rounded-xl shadow transition active:scale-95 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search Available Pitches</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
