import autokeras as ak
import os

print(f"AutoKeras version: {ak.__version__}")
print(f"AutoKeras path: {os.path.dirname(ak.__file__)}")

print("\nAttributes in top-level autokeras module:")
for attr in dir(ak):
    print(attr)

def check_attribute(module, module_name_str, attr_name):
    print(f"\nChecking for {attr_name} in {module_name_str}:")
    if hasattr(module, attr_name):
        print(f"{attr_name} IS present in {module_name_str}.")
        return True
    else:
        print(f"{attr_name} IS NOT present in {module_name_str}.")
        return False

# Check top level again
check_attribute(ak, "ak", "StructuredDataRegressor")
check_attribute(ak, "ak", "StructuredDataInput")
check_attribute(ak, "ak", "ImageRegressor") # Sanity check

# Check common submodules where it might reside
if hasattr(ak, 'tasks'):
    check_attribute(ak.tasks, "ak.tasks", "StructuredDataRegressor")
    check_attribute(ak.tasks, "ak.tasks", "StructuredDataInput") # Input might not be in tasks
else:
    print("\nak.tasks submodule NOT found.")

if hasattr(ak, 'engine'):
    check_attribute(ak.engine, "ak.engine", "StructuredDataRegressor") # Less likely here
else:
    print("\nak.engine submodule NOT found.")

if hasattr(ak, 'nodes'): # For input nodes
    check_attribute(ak.nodes, "ak.nodes", "StructuredDataInput")
else:
    print("\nak.nodes submodule NOT found.")

if hasattr(ak, 'blocks'): # For input blocks (alternative to Input nodes sometimes)
    check_attribute(ak.blocks, "ak.blocks", "StructuredDataInput") # Less common for direct use as input
    check_attribute(ak.blocks, "ak.blocks", "StructuredDataBlock")
else:
    print("\nak.blocks submodule NOT found.")

print("\nIf StructuredDataRegressor is still not found directly, it implies either a deeper packaging issue or a significant API change not reflected in common usage patterns.") 