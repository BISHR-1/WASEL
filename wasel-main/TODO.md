# Wasel App UI Fixes - TODO List

## Header & Layout Fixes
- [x] Remove duplicate header from Home.jsx (search/location already in Layout.jsx)
- [x] Add safe area padding to Layout.jsx header
- [x] Fix bottom navigation FAB color (should be green #1F7A63)
- [x] Remove categories from bottom nav, keep only Home, Cart, Account

## Banner Improvements
- [x] Add illustration to main banner in Home.jsx
- [x] Enlarge CTA button
- [x] Add ribbon discount badge

## Grid & Icons
- [x] Unify grid icons spacing in shop by category section
- [x] Improve overall spacing and alignment

## Authentication Fixes
- [x] Fix login validation in auth.js to properly check against stored user data
- [x] Ensure email/password validation works correctly

## Search Functionality
- [x] Implement real search with Base44 data integration
- [x] Add proper navigation to search results
- [x] Fix SearchBar.jsx to work with actual products

## Cart Fixes
- [x] Fix empty cart navigation to go to Home instead of menu
- [x] Improve payment UI positioning and color coding
- [x] Add address form for WhatsApp orders
- [x] Update WhatsApp message to include address details
- [x] Make WhatsApp payment button more prominent and visible
- [x] Remove PayPal payment text when WhatsApp is selected

## Testing & Validation
- [x] Test all navigation flows
- [x] Verify authentication works
- [x] Check payment flows
- [x] Ensure RTL layout is maintained
