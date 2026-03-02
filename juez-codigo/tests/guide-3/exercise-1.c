#include <stdio.h>
#include <assert.h>

int multiplyByThree(int x);

int main()
{
    assert(multiplyByThree(2) == 6);
    assert(multiplyByThree(-3) == -9);
    assert(multiplyByThree(0) == 0);
    assert(multiplyByThree(7) == 21);
    assert(multiplyByThree(-1) == -3);
    assert(multiplyByThree(100) == 300);
    printf("All tests passed!\n");
    return 0;
}