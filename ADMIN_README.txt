# KIVRO ADMIN PANEL
## Access: admin.kivro.africa

### Quick Start

#### Local Development:
```bash
npm run dev:admin
# Opens at http://localhost:3001
```

#### Build for Production:
```bash
npm run build:admin
# Output: admin-dist/
```

#### Deploy to Production:
```bash
# Windows
deploy-admin.bat

# Mac/Linux
./deploy-admin.sh

# Or manually
vercel --prod --name kivro-admin --config admin-vercel.json
```

---

### Admin Panel Features

✅ **Dashboard Overview**
- Total users count
- Active subscriptions
- Total addresses generated
- Payment statistics
- Revenue tracking

✅ **User Management**
- View all users
- Create new users
- Delete users (with cascade)
- Send emails to users
- View user details

✅ **Address Management**
- View all KIVRO addresses
- See owner information
- Copy address details
- Filter by status

✅ **Payment Management**
- View all transactions
- Track payment status
- Monitor revenue

✅ **Inbox System**
- View all system messages
- Filter by priority
- Message details

---

### Access Control

**Admin Login Required:**
- Only users with `user_type = 'admin'` can access
- Automatic redirect to login if not authenticated
- Session-based authentication via Supabase

**Creating Admin Users:**
1. Use the admin panel to create a user
2. Set user type to "Admin"
3. User receives welcome email
4. They can now access admin.kivro.africa

---

### Environment Variables

Required for admin panel:

```env
VITE_API_URL=https://api.kivro.africa
VITE_SUPABASE_URL=https://dfcuyinwearuhlhrdssx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_ADMIN_PORTAL=true
VITE_APP_TITLE=Kivro Admin Portal
```

---

### File Structure

```
admin.html              # Admin panel HTML entry
src/admin-main.tsx      # Admin panel entry point
src/AdminApp.tsx        # Admin app component
src/pages/admin/        # Admin pages
  ├── AdminDashboardReal.tsx
  ├── UserManagement.tsx
  ├── PackageManagement.tsx
  └── ...
vite.admin.config.ts    # Admin build config
admin-vercel.json       # Admin deployment config
```

---

### Deployment Checklist

- [ ] Build admin panel: `npm run build:admin`
- [ ] Deploy to Vercel: `vercel --prod --name kivro-admin`
- [ ] Configure DNS: admin.kivro.africa → Vercel
- [ ] Add domain in Vercel dashboard
- [ ] Set environment variables in Vercel
- [ ] Wait for SSL certificate
- [ ] Test login and features
- [ ] Verify API connectivity

---

### Security Features

🔒 **Built-in Security:**
- No indexing by search engines (noindex, nofollow)
- X-Frame-Options: DENY (prevents iframe embedding)
- X-Content-Type-Options: nosniff
- Strict referrer policy
- Admin-only access control
- JWT token authentication

---

### Troubleshooting

**Can't access admin panel:**
- Check you're using an admin account
- Clear browser cache
- Check API_URL is correct
- Verify backend is running

**Stats showing 0:**
- Check backend API is accessible
- Verify database connection
- Check console for errors

**Can't delete users:**
- Can't delete yourself
- Check admin permissions
- Verify backend endpoint

---

### Support

For issues or questions:
1. Check deployment logs in Vercel
2. Review browser console for errors
3. Verify environment variables
4. Check API endpoints
5. Review admin_deployment_guide.txt

---

### URLs

**Production:**
- Admin Panel: https://admin.kivro.africa
- Main App: https://kivro.africa
- API: https://api.kivro.africa

**Development:**
- Admin Panel: http://localhost:3001
- Main App: http://localhost:8080
- API: http://localhost:3001

---

### Quick Commands

```bash
# Development
npm run dev:admin           # Run admin panel locally
npm run build:admin         # Build for production
npm run preview:admin       # Preview production build

# Deployment
./deploy-admin.sh          # Deploy (Mac/Linux)
deploy-admin.bat           # Deploy (Windows)

# Vercel
vercel --prod              # Deploy to production
vercel logs kivro-admin    # View deployment logs
vercel ls                  # List deployments
```

---

### Admin Panel vs Main App

| Feature | Main App | Admin Panel |
|---------|----------|-------------|
| URL | kivro.africa | admin.kivro.africa |
| Entry | index.html | admin.html |
| Build | npm run build | npm run build:admin |
| Output | dist/ | admin-dist/ |
| Config | vercel.json | admin-vercel.json |
| Access | All users | Admins only |
| Purpose | User dashboard | System management |

---

### Maintenance

**Regular Tasks:**
- Monitor user activity
- Check payment statistics
- Review system health
- Update admin accounts
- Backup database regularly

**Updates:**
1. Make code changes
2. Test locally: `npm run dev:admin`
3. Build: `npm run build:admin`
4. Deploy: `./deploy-admin.sh`
5. Verify at admin.kivro.africa

---

Last Updated: 2025-10-14
Version: 1.0.0
