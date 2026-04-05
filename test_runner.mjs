const c_code = `#include <stdio.h>

struct Vector2D {
  float x;
  float y;
};

int main() {
  struct Vector2D vec;
  vec.x = 10.5;
  vec.y = 20.0;
  
  float val;
  scanf("%f", &val);
  printf("Values: %f", vec.x + val);
  return 0;
}
`;

const cpp_code = `#include <iostream>
using namespace std;

class MathUtil {
private:
  int internalOffset;
public:
  int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
  }
};

int main() {
  MathUtil math;
  try {
     int result = math.factorial(5);
     cout << result << endl;
  } catch (Exception e) {
     throw e;
  }
  return 0;
}
`;

const py_code = `import sys
from math import pi

class Calculator:
  def __init__(self):
      pass

  def fibonacci(self, n: int) -> int:
      if n <= 1:
          return n
      return self.fibonacci(n - 1) + self.fibonacci(n - 2)

if __name__ == "__main__":
    calc = Calculator()
    try:
        val = input("Number: ")
        result = calc.fibonacci(6)
        print(result)
    except Exception as e:
        raise e
`;

import('./src/compiler/engine.js').then(engine => {
    console.log('--- TESTING C ENGINE ---');
    try {
        let resC = engine.compileAll(c_code, 'c');
        console.log('C Engine OK. Quads:', resC.icg.quads.length);
    } catch (e) {
        console.error('C Engine Failed:', e);
    }

    console.log('\\n--- TESTING CPP ENGINE ---');
    try {
        let resCPP = engine.compileAll(cpp_code, 'cpp');
        console.log('C++ Engine OK. Quads:', resCPP.icg.quads.length);
    } catch (e) {
        console.error('C++ Engine Failed:', e);
    }

    console.log('\\n--- TESTING PYTHON ENGINE ---');
    try {
        let resPy = engine.compileAll(py_code, 'python');
        console.log('Python Engine OK. Quads:', resPy.icg.quads.length);
    } catch (e) {
        console.error('Python Engine Failed:', e);
    }
}).catch(console.error);
