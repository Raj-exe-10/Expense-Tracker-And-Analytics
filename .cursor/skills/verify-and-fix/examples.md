# Verify-and-fix report examples

## Pass

```markdown
### Verification
- Scope: frontend `ExpenseForm.tsx`, `expensesAPI`
- tsc: pass
- tests: `expenseSlice` pass
- Bugbot: no blocking findings
- Security: skipped (not sensitive scope)
Status: done
```

## Fail then fix

```markdown
### Verification (attempt 1)
- tsc: FAIL — `Budget.tsx` unused import / type error on line 42
- Bugbot: High — missing auth check on new list action

### Fixes
- Removed unused import; corrected Wallet type
- Scoped queryset to `request.user`

### Verification (attempt 2)
- tsc: pass
- pytest apps/budget/tests: pass
- Bugbot: clear
Status: done
```
