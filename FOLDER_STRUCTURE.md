# E-Commerce Backend Project Structure

```
veleco-backend/
├── 📁 .git/                           # Git version control
├── 📁 .vercel/                        # Vercel deployment configuration
│   └── project.json                   # Vercel project settings
├── 📁 node_modules/                   # Node.js dependencies
│
├── 📁 api/                            # API entry point
│   └── index.ts                       # Main API routes handler
│
├── 📁 db/                             # Database configuration
│   ├── .gitignore                     # Database-specific git ignore
│   ├── 📁 generated/                  # Prisma generated files
│   │   └── 📁 prisma/                 # Generated Prisma client
│   ├── 📁 prisma/                     # Prisma schema and migrations
│   │   ├── schema.prisma              # Database schema definition
│   │   └── 📁 migrations/             # Database migration files
│   └── 📁 seed/                       # Database seeding scripts
│       ├── seed_notification_data.ts  # Notification seed data
│       ├── seed_seller_dashboard.ts   # Seller dashboard seed data
│       ├── seed_settings_data.ts      # Settings seed data
│       ├── seed_support_tickets.ts    # Support tickets seed data
│       └── seed_support_ticket_data.ts # Support ticket data
│
├── 📁 lib/                            # Shared libraries
│   └── prisma.ts                      # Prisma client configuration
│
├── 📁 models/                         # Business logic and API models
│   ├── 📁 auth/                       # Authentication modules
│   │   └── middleware.ts              # Auth middleware
│   ├── 📁 roles/                      # User role definitions
│   │   ├── admin.ts                   # Admin role logic
│   │   ├── seller.ts                  # Seller role logic
│   │   └── user.ts                    # User role logic
│   ├── cart.ts                        # Shopping cart logic
│   ├── cart_items.ts                  # Cart items management
│   ├── notification_api.ts            # Notification API endpoints
│   ├── notification_routes.ts         # Notification routes
│   ├── orders.ts                      # Order management
│   ├── payment_api.ts                 # Payment processing API
│   ├── payment_integration_example.ts # Payment integration examples
│   ├── payment_routes.ts              # Payment routes
│   ├── percentage.ts                  # Percentage calculations
│   ├── products.ts                    # Product management
│   ├── seller_cap.ts                  # Seller capabilities
│   ├── seller_dashboard.ts            # Seller dashboard logic
│   ├── seller_dashboard_extended.ts   # Extended seller features
│   ├── session.ts                     # Session management
│   ├── settings_management_api.ts     # Settings API
│   ├── settings_management_routes.ts  # Settings routes
│   └── store.ts                       # Store management
│
├── 📁 script/                         # Build and utility scripts
│   ├── build.js                       # Build script
│   └── generate-prisma.js             # Prisma generation script
│
├── 📁 utils/                          # Utility functions
│   └── cartUtils.ts                   # Cart utility functions
│
├── 📄 Configuration Files
├── .env                               # Environment variables
├── .env.backup                        # Environment backup
├── .env.clean                         # Clean environment template
├── .env.development.local             # Development environment
├── .env.example                       # Example environment file
├── .env.vercel                        # Vercel environment
├── .gitignore                         # Git ignore rules
├── .vercelignore                      # Vercel ignore rules
├── vercel.json                        # Vercel deployment config
├── tsconfig.json                      # TypeScript configuration
├── package.json                       # Node.js dependencies
├── package-lock.json                  # Locked dependencies
├── bun.lock                          # Bun lockfile
├── docker-compose.yml                 # Docker configuration
│
├── 📄 Application Files
├── index.ts                           # Main application entry
├── mail.ts                           # Email functionality
├── middleware.js                      # Express middleware
├── support_ticket_api.ts             # Support ticket API
├── support_ticket_mail.ts            # Support ticket email
├── support_ticket_routes.ts          # Support ticket routes
│
├── 📄 Documentation
├── README.md                          # Project documentation
├── IMPLEMENTATION_SUMMARY.md          # Implementation details
├── SELLER_DASHBOARD_TESTING_GUIDE.md  # Testing guide
├── SUPPORT_TICKET_API_ENDPOINTS.md    # API documentation
├── SUPPORT_TICKET_SYSTEM_GUIDE.md     # System guide
├── PRISMA_MIGRATION_GUIDE.md          # Migration guide
├── uml.mmd                           # UML diagrams
└── setup-env.sh                      # Environment setup script
```

## 📊 Project Overview

### **Core Architecture**
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: Vercel serverless functions
- **Runtime**: Bun for local development, Node.js for production
- **File Storage**: Cloudinary integration

### **Key Features**
- 🛒 **E-commerce Core**: Products, cart, orders, payments
- 👥 **User Management**: Authentication, roles (admin/seller/user)
- 📊 **Seller Dashboard**: Extended seller capabilities
- 🎫 **Support System**: Ticket management with email integration
- 🔔 **Notifications**: Real-time notification system
- ⚙️ **Settings**: Configurable application settings

### **API Structure**
- `/api/user/*` - User management endpoints
- `/api/admin/*` - Admin panel endpoints
- `/api/seller/*` - Seller dashboard endpoints
- `/api/payments/*` - Payment processing
- `/api/notifications/*` - Notification system
- `/api/settings/*` - Application settings
- `/api/support/*` - Support ticket system
- `/store/*` - Store management
- `/product/*` - Product catalog
- `/cart/*` - Shopping cart
- `/order/*` - Order management
- `/dashboard/*` - Dashboard routes

### **Development Tools**
- **Database Management**: Prisma migrations and seeding
- **Type Safety**: Full TypeScript coverage
- **Build System**: Custom build scripts
- **Environment Management**: Multiple environment configurations
- **Documentation**: Comprehensive guides and API docs

### **Deployment Configuration**
- **Serverless**: Optimized for Vercel functions
- **Environment Variables**: Secure configuration management
- **Database**: PostgreSQL with connection pooling
- **File Uploads**: Cloudinary integration
- **Email**: Nodemailer integration for notifications
