#!/bin/bash
# IMPEasy API comprehensive test script
set -e
API="http://localhost:3000"
TOKEN=$(curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"admin@impeasy.local","password":"Admin123!"}' | jq -r '.accessToken')

auth() { curl -s -H "Authorization: Bearer $TOKEN" "$@"; }
post() { curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" "$@"; }
patch() { curl -s -X PATCH -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" "$@"; }
del() { curl -s -X DELETE -H "Authorization: Bearer $TOKEN" "$@"; }

PASS=0 FAIL=0
check() { if [ "$1" = "200" ] || [ "$1" = "201" ] || [ "$1" = "204" ]; then echo "PASS: $2"; ((PASS++)); else echo "FAIL: $2 (HTTP $1)"; ((FAIL++)); fi; }

echo "=== AUTH ==="
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auth/login" -H "Content-Type: application/json" -d '{"email":"admin@impeasy.local","password":"Admin123!"}')
check "$code" "Login"
code=$(curl -s -o /dev/null -w "%{http_code}" auth "$API/auth/me")
check "$code" "Get current user"
code=$(curl -s -o /dev/null -w "%{http_code}" auth "$API/auth/users")
check "$code" "List users"
code=$(curl -s -o /dev/null -w "%{http_code}" auth "$API/auth/roles")
check "$code" "List roles"

echo "=== CRM ==="
code=$(curl -s -o /dev/null -w "%{http_code}" auth "$API/customers")
check "$code" "List customers"
code=$(curl -s -o /dev/null -w "%{http_code}" auth "$API/quotes")
check "$code" "List quotes"
code=$(curl -s -o /dev/null -w "%{http_code}" auth "$API/sales-orders")
check "$code" "List sales orders"
code=$(curl -s -o /dev/null -w "%{http_code}" auth "$API/invoices")
check "$code" "List invoices"

echo "=== PRODUCTION ==="
code=$(curl -s -o /dev/null -w "%{http_code}" auth "$API/manufacturing-orders")
check "$code" "List manufacturing orders"
code=$(curl -s -o /dev/null -w "%{http_code}" auth "$API/workstation-groups")
check "$code" "List workstation groups"
code=$(curl -s -o /dev/null -w "%{http_code}" auth "$API/workstations")
check "$code" "List workstations"
code=$(curl -s -o /dev/null -w "%{http_code}" auth "$API/boms/item/1")
check "$code" "Get BOM by item (may 404)"
code=$(curl -s -o /dev/null -w "%{http_code}" auth "$API/routings/item/1")
check "$code" "Get routing by item (may 404)"

echo "=== STOCK ==="
code=$(curl -s -o /dev/null -w "%{http_code}" auth "$API/items")
check "$code" "List items"
code=$(curl -s -o /dev/null -w "%{http_code}" auth "$API/stock/items")
check "$code" "List stock items"
code=$(curl -s -o /dev/null -w "%{http_code}" auth "$API/stock/lots")
check "$code" "List stock lots"
code=$(curl -s -o /dev/null -w "%{http_code}" auth "$API/shipments")
check "$code" "List shipments"
code=$(curl -s -o /dev/null -w "%{http_code}" auth "$API/inventory-items")
check "$code" "List inventory items"
code=$(curl -s -o /dev/null -w "%{http_code}" auth "$API/stock-settings/product-groups")
check "$code" "List product groups"
code=$(curl -s -o /dev/null -w "%{http_code}" auth "$API/stock-settings/unit-of-measures")
check "$code" "List units of measure"

echo "=== PROCUREMENT ==="
code=$(curl -s -o /dev/null -w "%{http_code}" auth "$API/suppliers")
check "$code" "List suppliers"
code=$(curl -s -o /dev/null -w "%{http_code}" auth "$API/purchase-orders")
check "$code" "List purchase orders"
code=$(curl -s -o /dev/null -w "%{http_code}" auth "$API/vendor-invoices")
check "$code" "List vendor invoices"

echo "=== SETTINGS ==="
code=$(curl -s -o /dev/null -w "%{http_code}" auth "$API/settings/company")
check "$code" "Company settings"
code=$(curl -s -o /dev/null -w "%{http_code}" auth "$API/settings/numbering")
check "$code" "Numbering settings"

echo "=== CREATE/EDIT/DELETE TESTS ==="
# Create customer
resp=$(post "$API/customers" -d '{"name":"Test Customer API","status":"interested","email":"test@test.com"}')
cid=$(echo "$resp" | jq -r '.id')
if [ "$cid" != "null" ] && [ -n "$cid" ]; then echo "PASS: Create customer (id=$cid)"; ((PASS++)); else echo "FAIL: Create customer"; ((FAIL++)); fi

# Create item
resp=$(post "$API/items" -d '{"name":"Test Item API","code":"TEST-API-01","itemGroup":"Test","unitOfMeasure":"pcs","itemType":"procured","defaultPrice":10}')
iid=$(echo "$resp" | jq -r '.id')
if [ "$iid" != "null" ] && [ -n "$iid" ]; then echo "PASS: Create item (id=$iid)"; ((PASS++)); else echo "FAIL: Create item"; ((FAIL++)); fi

# Create supplier
resp=$(post "$API/suppliers" -d '{"name":"Test Supplier API","email":"sup@test.com"}')
sid=$(echo "$resp" | jq -r '.id')
if [ "$sid" != "null" ] && [ -n "$sid" ]; then echo "PASS: Create supplier (id=$sid)"; ((PASS++)); else echo "FAIL: Create supplier"; ((FAIL++)); fi

# Create workstation group
resp=$(post "$API/workstation-groups" -d '{"name":"Test WG API","instanceCount":1}')
wgid=$(echo "$resp" | jq -r '.id')
if [ "$wgid" != "null" ] && [ -n "$wgid" ]; then echo "PASS: Create workstation group (id=$wgid)"; ((PASS++)); else echo "FAIL: Create workstation group"; ((FAIL++)); fi

# Create quote
resp=$(post "$API/quotes" -d "{\"customerId\":$cid,\"status\":\"draft\",\"quoteDate\":\"2026-03-15\",\"validityDate\":\"2026-04-15\",\"promisedDate\":\"2026-03-25\",\"salespersonName\":\"Test\",\"salespersonEmail\":\"test@test.com\",\"paymentTerm\":\"30 days\",\"shippingTerm\":\"DAP\",\"shippingMethod\":\"Road\",\"taxMode\":\"exclusive\",\"documentDiscountPercent\":0,\"subtotalAmount\":100,\"discountAmount\":0,\"taxAmount\":0,\"totalAmount\":100}")
qid=$(echo "$resp" | jq -r '.id')
if [ "$qid" != "null" ] && [ -n "$qid" ]; then echo "PASS: Create quote (id=$qid)"; ((PASS++)); else echo "FAIL: Create quote"; ((FAIL++)); fi

# Kiosk / Operations
code=$(curl -s -o /dev/null -w "%{http_code}" auth "$API/operations/queue")
check "$code" "Operations queue (kiosk)"

echo "=== SUMMARY ==="
echo "PASS: $PASS | FAIL: $FAIL"
