# ORDRIVA POS - Testing & Quality Assurance

## Critical Test Scenarios
| Test ID | Scenario | Expected Behavior |
| :--- | :--- | :--- |
| **TC-01** | Create valid order | Order and kitchen ticket generated once with exact snapshot prices |
| **TC-02** | Submit checkout twice with same idempotency key | Exactly one payment record saved; no double charge |
| **TC-03** | Price changes while customer cart is open | Server validates latest prices at checkout |
| **TC-04** | Unauthorized user calls manager refund endpoint | Request rejected with 403 Forbidden |
| **TC-05** | User attempts query across unauthorized branch | Scoped filter blocks cross-tenant access |
| **TC-06** | Payment provider timeout | Order remains in pending state; no false success |
| **TC-07** | Order settlement inventory trigger | Raw ingredients deducted based on recipe bill-of-materials |
| **TC-08** | Refund amount exceeds paid amount | Reversal rejected |
| **TC-09** | Offline connection lost | UI displays offline warning; cart saved to local storage |

