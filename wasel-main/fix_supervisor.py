import re

with open("src/pages/SupervisorPanel.jsx", "r", encoding="utf-8") as f:
    text = f.read()

assign_func_pattern = r"const existingAssignment = Array\.isArray\(order\.order_assignments\) \&\& order\.order_assignments\.length > 0 \? order\.order_assignments\[0\] : null;.*?(?=try \{|if \(!)"
# Actually it's better to just replace the whole logic inside 	ry { block for handleAssignOrder

# Find handleAssignOrder
# Let's search inside the script manually

