#include <errno.h>
#include <signal.h>
#include <sys/prctl.h>
#include <unistd.h>

#include <bluetooth/bluetooth.h>
#include <bluetooth/l2cap.h>

#define ATT_CID 4

int lastSignal = 0;

static void signalHandler(int signal) {
  lastSignal = signal;
}

int main(int argc, const char* argv[]) {

  int serverL2capSock;
  struct sockaddr_l2 sockAddr;
  socklen_t sockAddrLen;
  int result;
  bdaddr_t clientBdAddr;
  int clientL2capSock;

  fd_set afds;
  fd_set rfds;
  struct timeval tv;

  char stdinBuf[256 * 2 + 1];
  char l2capSockBuf[256];
  int len;
  int i;

  // setup signal handlers
  signal(SIGINT, signalHandler);
  signal(SIGKILL, signalHandler);
  signal(SIGHUP, signalHandler);

  prctl(PR_SET_PDEATHSIG, SIGINT);

  // create socket
  serverL2capSock = socket(AF_BLUETOOTH, SOCK_SEQPACKET, BTPROTO_L2CAP);

  // bind
  memset(&sockAddr, 0, sizeof(sockAddr));
  sockAddr.l2_family = AF_BLUETOOTH;
  sockAddr.l2_bdaddr = *BDADDR_ANY;
  sockAddr.l2_cid = htobs(ATT_CID);

  result = bind(serverL2capSock, (struct sockaddr*)&sockAddr, sizeof(sockAddr));

  printf("bind %s\n", (result == -1) ? strerror(errno) : "success");

  result = listen(serverL2capSock, 1);

  printf("listen %s\n", (result == -1) ? strerror(errno) : "success");

  while (result != -1) {
    FD_ZERO(&afds);
    FD_SET(serverL2capSock, &afds);

    tv.tv_sec = 1;
    tv.tv_usec = 0;

    result = select(serverL2capSock + 1, &afds, NULL, NULL, &tv);

    if (-1 == result) {
      if (SIGINT == lastSignal || SIGKILL == lastSignal) {
        break;
      }
    } else if (result && FD_ISSET(serverL2capSock, &afds)) {
      sockAddrLen = sizeof(sockAddr);
      clientL2capSock = accept(serverL2capSock, (struct sockaddr *)&sockAddr, &sockAddrLen);

      baswap(&clientBdAddr, &sockAddr.l2_bdaddr);
      printf("accept %s\n", batostr(&clientBdAddr));

      while(1) {
        FD_ZERO(&rfds);
        FD_SET(0, &rfds);
        FD_SET(clientL2capSock, &rfds);

        tv.tv_sec = 1;
        tv.tv_usec = 0;

        result = select(clientL2capSock + 1, &rfds, NULL, NULL, &tv);

        if (-1 == result) {
          if (SIGINT == lastSignal || SIGKILL == lastSignal || SIGHUP == lastSignal) {
            if (SIGHUP == lastSignal) {
              result = 0;
            }
            break;
          }
        } else if (result) {
          if (FD_ISSET(0, &rfds)) {
            len = read(0, stdinBuf, sizeof(stdinBuf));

            if (len <= 0) {
              break;
            }

            i = 0;
            while(stdinBuf[i] != '\n') {
              sscanf(&stdinBuf[i], "%02x", (unsigned int*)&l2capSockBuf[i / 2]);

              i += 2;
            }

            len = write(clientL2capSock, l2capSockBuf, (len - 1) / 2);
          }

          if (FD_ISSET(clientL2capSock, &rfds)) {
            len = read(clientL2capSock, l2capSockBuf, sizeof(l2capSockBuf));

            if (len <= 0) {
              break;
            }

            printf("data ");
            for(i = 0; i < len; i++) {
              printf("%02x", ((int)l2capSockBuf[i]) & 0xff);
            }
            printf("\n");
          }
        }
      }

      printf("disconnect %s\n", batostr(&clientBdAddr));
      close(clientL2capSock);
    }
  }

  printf("close\n");
  close(serverL2capSock);

  return 0;
}
