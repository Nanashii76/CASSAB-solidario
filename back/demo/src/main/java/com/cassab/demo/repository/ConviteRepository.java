package com.cassab.demo.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cassab.demo.model.Convite;

public interface ConviteRepository  extends JpaRepository<Convite, UUID>{}
