#include <stdio.h>
#include <assert.h>

int multiplyByTwo(int x);

int main()
{
    assert(multiplyByTwo(2) == 4 && "multiplyByTwo(2) deberia retornar 4");
    assert(multiplyByTwo(-3) == -6 && "multiplyByTwo(-3) deberia retornar -6");
    assert(multiplyByTwo(0) == 0 && "multiplyByTwo(0) deberia retornar 0");
    assert(multiplyByTwo(7) == 14 && "multiplyByTwo(7) deberia retornar 14");
    assert(multiplyByTwo(-1) == -2 && "multiplyByTwo(-1) deberia retornar -2");
    assert(multiplyByTwo(100) == 200 && "multiplyByTwo(100) deberia retornar 200");
    printf("All tests passed!\n");
    return 0;
}