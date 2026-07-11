# Test examples (LedgerCore patterns)

## Backend API (sketch)

```python
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

User = get_user_model()

class MyEndpointTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='u1', email='u1@test.com', password='testpass123'
        )
        self.other = User.objects.create_user(
            username='u2', email='u2@test.com', password='testpass123'
        )
        self.client = APIClient()

    def test_requires_auth(self):
        res = self.client.get('/api/.../')
        self.assertEqual(res.status_code, 401)

    def test_happy_path(self):
        self.client.force_authenticate(user=self.user)
        res = self.client.get('/api/.../')
        self.assertEqual(res.status_code, 200)
```

## Frontend slice (sketch)

```typescript
import { configureStore } from '@reduxjs/toolkit';
import reducer, { clearError } from '../mySlice';

describe('mySlice', () => {
  it('clearError resets error', () => {
    const store = configureStore({ reducer: { my: reducer } });
    store.dispatch(clearError());
    expect(store.getState().my.error).toBeNull();
  });
});
```
