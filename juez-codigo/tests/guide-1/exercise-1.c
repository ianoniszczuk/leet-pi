#include <stdio.h>
#include <assert.h>

int multiplyByTwo(int x);

int main()
{
    assert(multiplyByTwo(2) == 4);
    assert(multiplyByTwo(-3) == -6);
    assert(multiplyByTwo(0) == 0);
    assert(multiplyByTwo(7) == 14);
    assert(multiplyByTwo(-1) == -2);
    assert(multiplyByTwo(100) == 200);
    printf("All tests passed!\n");
    return 0;
}