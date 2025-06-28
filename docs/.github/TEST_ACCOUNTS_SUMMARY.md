# Test Accounts Summary

## ✅ Successfully Created 30 Test Accounts

All test accounts have been created with proper authentication and profile records, mimicking the web signup behavior.

### Account Details

**Pattern**: `test{1-30}@example.com`  
**Password**: `William1!` (for all accounts)  
**Names**: `test1`, `test2`, ..., `test30`

### Complete Account List

| Email              | Name   | User ID                              | Status   |
| ------------------ | ------ | ------------------------------------ | -------- |
| test1@example.com  | test1  | a871fbc2-fac6-490e-9801-ad77c2509eab | ✅ Ready |
| test2@example.com  | test2  | 7466d03a-fc70-4ad2-aff9-23f13affd1dd | ✅ Ready |
| test3@example.com  | test3  | 6ab5b38c-d0d7-40e0-aad8-388dff68fc89 | ✅ Ready |
| test4@example.com  | test4  | dbb0e731-2c74-42b9-bca4-4d097af602d0 | ✅ Ready |
| test5@example.com  | test5  | b6c8b0ff-741c-4596-ae82-87a03e125b8d | ✅ Ready |
| test6@example.com  | test6  | 02ac1d9e-5aaf-49e5-afe1-fa322c24fe37 | ✅ Ready |
| test7@example.com  | test7  | a2372b72-2c24-4419-ac74-9dff8dfc8aef | ✅ Ready |
| test8@example.com  | test8  | e0d1f3aa-4057-44ec-a623-4c7e38c970f3 | ✅ Ready |
| test9@example.com  | test9  | d40691ed-a332-4837-a5ec-ea38631678c7 | ✅ Ready |
| test10@example.com | test10 | 232822c4-5ff5-4d5a-8c00-e9e7be7dd0e3 | ✅ Ready |
| test11@example.com | test11 | b59f9bb4-90e5-4240-beaa-f7d7fb518cde | ✅ Ready |
| test12@example.com | test12 | ca345cbf-0ebc-448c-a002-d2e69fc5b985 | ✅ Ready |
| test13@example.com | test13 | cb42c2e6-7b7d-46c6-9dcf-fd1f91d7dead | ✅ Ready |
| test14@example.com | test14 | 6e1bccc0-1ca8-44e3-a390-08cac0608e2f | ✅ Ready |
| test15@example.com | test15 | b65b75fc-fd05-47c1-a9dc-1c9cece156b1 | ✅ Ready |
| test16@example.com | test16 | de88a7c0-a483-4404-987c-4d8d3ac20428 | ✅ Ready |
| test17@example.com | test17 | 0eb9890b-4cc2-458c-bce0-6746371ebd8e | ✅ Ready |
| test18@example.com | test18 | 913dd081-349a-4ece-b61e-cc1a6503f565 | ✅ Ready |
| test19@example.com | test19 | a0c768b1-58a3-499b-89e5-f8879af75ca2 | ✅ Ready |
| test20@example.com | test20 | 0902821d-b253-4bc3-91dc-788216d0cdc7 | ✅ Ready |
| test21@example.com | test21 | 30204e53-e61a-4272-8d04-83fd6b549797 | ✅ Ready |
| test22@example.com | test22 | 2b2da476-4b6a-4813-9336-c57e4deb7399 | ✅ Ready |
| test23@example.com | test23 | 1e422118-166a-443e-8bdf-f53ac395b72f | ✅ Ready |
| test24@example.com | test24 | 4076269d-1615-410d-b231-c3ee02fb845c | ✅ Ready |
| test25@example.com | test25 | f336c5ff-4796-4fd4-8aa7-8aa492d1c8af | ✅ Ready |
| test26@example.com | test26 | fccdf7bd-02ef-4794-badd-789d8ae3208b | ✅ Ready |
| test27@example.com | test27 | 8b7e9428-ed98-48fc-b30a-b8b2b45fad1e | ✅ Ready |
| test28@example.com | test28 | 651ff4ad-1ebb-4fd1-b1db-83fbbf1b05cd | ✅ Ready |
| test29@example.com | test29 | 4c2f1a32-4845-4019-83f2-1285387c9124 | ✅ Ready |
| test30@example.com | test30 | b2645f15-a673-400c-9079-21c02cb580b1 | ✅ Ready |

## Database Records Created

Each account has:

- ✅ **Auth User** in `auth.users` table
- ✅ **Profile** in `public.profiles` table
- ✅ **Email confirmed** (auto-confirmed)
- ✅ **Provider**: email
- ✅ **Full name**: matches email prefix (test1, test2, etc.)

## Management API Endpoints

### Check Account Status

```bash
GET /api/test/fix-test-profiles
```

### Create New Test Accounts (if needed)

```bash
POST /api/test/create-test-accounts
```

### Fix Missing Profiles

```bash
POST /api/test/fix-test-profiles
```

### Cleanup All Test Accounts

```bash
DELETE /api/test/cleanup-test-accounts
```

## Usage Instructions

1. **Login**: Use any test email with password `William1!`
2. **Testing**: Perfect for testing subscriptions, purchases, and user flows
3. **Cleanup**: Use the cleanup endpoint when done testing

## Notes

- All endpoints only work in development mode
- Accounts are created with email provider (not social login)
- All emails are auto-confirmed
- Profiles follow the same structure as web signup
- Safe to delete and recreate as needed

---

**Total Created**: 30 accounts  
**Status**: All ready for testing  
**Password**: William1! (same for all)
