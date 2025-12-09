"use client";

export function loadWatchlist() {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem("watchlist") || "[]");
}

export function saveWatchlist(list) {
  localStorage.setItem("watchlist", JSON.stringify(list));
}
