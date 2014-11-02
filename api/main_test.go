package main

import (
	"fmt"
	"testing"
)

// best test is human test
func TestAccountGenBitcoinAddress(t *testing.T) {
	acct := NewAccount()
	err, enaddr := acct.GenDepositAddr()

	if err != nil {
		t.Error("error")
	}

	fmt.Printf("%s should look like an address", enaddr)
}
