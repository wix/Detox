BINS := SocketRocket.framework libSocketRocket.a

all: $(BINS)

HEADERS := SRWebSocket.h
SRCS := SRWebSocket.m
OBJS := $(SRCS:%.m=%.o)

CFLAGS += -fobjc-arc

libSocketRocket.a: $(OBJS)
	$(AR) -rc $(AFLAGS) $@ $^

SocketRocket.framework: libSocketRocket.a
	mkdir -p $@/Headers
	cp -f $(HEADERS) $@/Headers
	cp $^ $@/SocketRocket

clean:
	rm -r $(OBJS) $(BINS)
