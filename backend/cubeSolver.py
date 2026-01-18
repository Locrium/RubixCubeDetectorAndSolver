from cube_solver import *

def solveCube(cube_string):
    # Solve cube and return it
    if len(cube_string) != 54:
        return (False, "String length is not correct!")
    if not cube_string.isalpha() or not cube_string.isupper():
        return (False, "String representation contains invalid characters!")
    cube_object = Cube(repr=cube_string)
    solver = Kociemba()
    solution = solver.solve(cube_object)
    if solution is None:
        return (False, "No solution could be found!")
    # print(solution)
    return (True, solution)

# Example code for debugging
"""
Scramble: B' U' R2 B2 D F2 L2 D' R' U F U D' R2 F' B' L2 B' D2 B L U2 B' U B2
        ---------
        | R Y O |
        | W W R |
        | O B O |
---------------------------------
| B B G | W R W | B W Y | G G Y |
| G O Y | R G O | G R B | Y B W |
| Y W R | W O G | W G R | Y B O |
---------------------------------
        | B Y R |
        | O Y R |
        | B O G |
        ---------
Cube: RYOWWROBOBBGGOYYWRWRWRGOWOGBWYGRBWGRGGYYBWYBOBYROYRBOG
INFO: Creating tables\pruning_kociemba.npz (LONG!)
Solution: U F L2 D R B2 D' L' B L2 U2 L2 D' R2 B2 U F2 D R2 D2 L2 U2 (22)
"""

""" 
scramble = Maneuver.random()
print(f"Scramble: {scramble}")
cube = Cube(scramble)
print(cube)
print(f"Cube: {repr(cube)}")

solver = Kociemba()
solution = solver.solve(cube)
assert solution is not None
assert solution == scramble.inverse
print(f"Solution: {solution} ({len(solution)})") """