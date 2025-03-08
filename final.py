for i in range(6):
    for j in range(6-i):
        print(' ', end='')
    for j in range(i):
        print('*', end='')
    for j in range(i):
        if j == 0:
            continue
        print('*',end = '')

    print()


print('')
for i in range (6):
    for j in range(i):
        print(' ', end = '') 
    for j in range(6-i):
        print('*',end='')
    for j in range(6-i):
        if j == 0 :
            continue
        print('*', end='')
    print()

