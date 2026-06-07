export const ROUTES = {
  home: "/",

  auth: {
    login: "/login",
    register: "/register",
    registerUser: "/register/user",
    registerOwner: "/register/owner",
  },

  user: {
    dashboard: "/dashboard",
    bookings: "/bookings",
    profile: "/profile",
    favorites: "/favorites",
  },

  owner: {
    dashboard: "/owner/dashboard",
    venues: "/owner/venues",
    createVenue: "/owner/venues/create",
    bookings: "/owner/bookings",
    profile: "/owner/profile",
  },

  admin: {
    dashboard: "/admin/dashboard",
    owners: "/admin/owners",
    pendingOwners: "/admin/owners/pending",
    users: "/admin/users",
  },
} as const;
