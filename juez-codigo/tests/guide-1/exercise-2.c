#include <stdio.h>
#include <assert.h>

int multiplyByThree(int x);

int main()
{
    assert(multiplyByThree(2) == 6 && "multiplyByThree(2) deberia retornar 6");
    assert(multiplyByThree(-3) == -9 && "multiplyByThree(-3) deberia retornar -9");
    assert(multiplyByThree(0) == 0 && "multiplyByThree(0) deberia retornar 0");
    assert(multiplyByThree(7) == 21 && "multiplyByThree(7) deberia retornar 21");
    assert(multiplyByThree(-1) == -3 && "multiplyByThree(-1) deberia retornar -3");
    assert(multiplyByThree(100) == 300 && "multiplyByThree(100) deberia retornar 300");
    printf("All tests passed!\n");
    return 0;
}