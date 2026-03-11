import re

with open("src/pages/SupervisorPanel.jsx", "r", encoding="utf-8") as f:
    text = f.read()

pattern_to_replace = r"const existingAssignment = Array\.isArray\(order\.order_assignments\) &&.*?order\.order_assignments\.length > 0 \? order\.order_assignments\[0\] : null;"

replacement = """const existingAssignmentsArr = Array.isArray(order.order_assignments) ? order.order_assignments : (order.order_assignments ? [order.order_assignments] : []);
      const existingAssignment = existingAssignmentsArr.length > 0 ? existingAssignmentsArr[0] : null;"""

text = re.sub(pattern_to_replace, replacement, text, flags=re.MULTILINE)

with open("src/pages/SupervisorPanel.jsx", "w", encoding="utf-8") as f:
    f.write(text)

print('Done fixing assignments arrays!')
