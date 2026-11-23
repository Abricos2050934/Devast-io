function copyEvent(event) {
      const copy = {
        ...event,
        transport: event.transport ? { ...event.transport } : null,
        commandsInLast2s: { ...event.commandsInLast2s },
        browserFailures: { ...event.browserFailures },
      };
      if (event.pickupRequestsBeforeEnd) {
        copy.pickupRequestsBeforeEnd = event.pickupRequestsBeforeEnd.map(entry => ({ ...entry }));
      }
      return copy;
    }